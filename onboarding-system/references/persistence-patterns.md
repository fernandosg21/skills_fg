# Padrões de persistência

Como armazenar o `OnboardingState` em cada tipo de backend. Inclui schema, leitura/escrita e considerações específicas.

## Matriz de decisão

| Cenário | Estratégia recomendada |
|---------|------------------------|
| App tem auth + DB SQL | **Coluna JSON/JSONB na tabela de usuários** |
| App tem auth + DB NoSQL | **Campo embutido no document do usuário** |
| App tem auth + Firebase/Firestore | **Subcollection ou campo no doc do usuário** |
| App tem auth + Supabase | **Coluna JSONB em `auth.users` ou tabela espelho** |
| App sem auth (público) | **localStorage com chave versionada** |
| App híbrido (auth opcional) | **localStorage por padrão; sincroniza com DB se logar** |
| App em ambiente embarcado / kiosk | **localStorage + reset agendado** |

## Schema canônico

Independentemente do backend:

```json
{
  "version": 1,
  "completed_initial_tour": false,
  "dismissed_initial_tour": false,
  "module_welcomes_seen": [],
  "module_tours_seen": [],
  "last_seen_at": null
}
```

Mantenha o objeto **plano** e **pequeno** — deve caber em uma linha de log e ser lido inteiro a cada request. Não use objetos aninhados profundos.

## PostgreSQL

### Migration
```sql
-- Add JSONB column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_state JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN users.onboarding_state IS
  'Onboarding tracking: version, completed_initial_tour, dismissed_initial_tour, module_welcomes_seen[], module_tours_seen[], last_seen_at';

-- Optional: index for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
  ON users ((onboarding_state->>'completed_initial_tour'));
```

### Leitura
```sql
SELECT onboarding_state FROM users WHERE id = $1;
```

### Escrita (merge)
```sql
UPDATE users
SET onboarding_state = onboarding_state || $1::jsonb
WHERE id = $2;
```

O operador `||` faz merge superficial. Para arrays, faça o merge no app antes de salvar.

### Downgrade
```sql
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_state;
```

## MySQL 5.7+ / MariaDB 10.2+

```sql
ALTER TABLE users
  ADD COLUMN onboarding_state JSON NULL;

-- Reading
SELECT onboarding_state FROM users WHERE id = ?;

-- Writing (merge requires app-side logic — MySQL lacks native JSON merge)
UPDATE users SET onboarding_state = ? WHERE id = ?;
```

MySQL `JSON_MERGE_PATCH()` existe a partir do 5.7.22 e funciona para merge superficial:
```sql
UPDATE users
SET onboarding_state = JSON_MERGE_PATCH(COALESCE(onboarding_state, '{}'), ?)
WHERE id = ?;
```

## SQLite

```sql
ALTER TABLE users ADD COLUMN onboarding_state TEXT DEFAULT '{}';

-- Read
SELECT onboarding_state FROM users WHERE id = ?;

-- Write: serialize JSON in app, store as TEXT
UPDATE users SET onboarding_state = ? WHERE id = ?;
```

SQLite tem `json_patch()` desde 3.38 para merge nativo. Antes disso, faça merge no app.

## Supabase

Supabase usa Postgres por trás. **Não modifique `auth.users` direto** — crie uma tabela `public.users` espelho (que provavelmente já existe no projeto) e adicione lá.

```sql
-- Tipicamente já existe public.users com FK para auth.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_state JSONB NOT NULL DEFAULT '{}'::jsonb;
```

### RLS
Garanta que o usuário só lê/escreve seu próprio registro. Se a tabela já tem políticas `auth.uid() = id`, o `onboarding_state` herda automaticamente.

### Lendo via cliente JS
```ts
const { data } = await supabase
  .from('users')
  .select('onboarding_state')
  .eq('id', userId)
  .single();
```

### Server actions (Next.js)
Use `service_role` apenas se houver razão (bypass de RLS para super-admin). Para o próprio usuário, o cliente normal autenticado já basta.

## MongoDB

### Estrutura
```js
// users collection
{
  _id: ObjectId(...),
  email: "...",
  onboarding_state: {
    version: 1,
    completed_initial_tour: false,
    dismissed_initial_tour: false,
    module_welcomes_seen: [],
    module_tours_seen: [],
    last_seen_at: null
  }
}
```

### Leitura
```js
const user = await db.collection('users').findOne(
  { _id: userId },
  { projection: { onboarding_state: 1 } }
);
```

### Escrita (merge superficial)
```js
await db.collection('users').updateOne(
  { _id: userId },
  { $set: {
      'onboarding_state.completed_initial_tour': true,
      'onboarding_state.last_seen_at': new Date().toISOString(),
      'onboarding_state.version': 1
  }}
);
```

### Escrita (push em array sem duplicar)
```js
await db.collection('users').updateOne(
  { _id: userId },
  { $addToSet: { 'onboarding_state.module_welcomes_seen': moduleId },
    $set: { 'onboarding_state.last_seen_at': new Date().toISOString() }}
);
```

## Firestore

### Estrutura
```
users/{userId} {
  email: "...",
  onboarding_state: {
    version: 1,
    completed_initial_tour: false,
    ...
  }
}
```

### Leitura
```js
const snap = await db.doc(`users/${userId}`).get();
const state = snap.data()?.onboarding_state ?? defaultOnboardingState();
```

### Escrita
```js
await db.doc(`users/${userId}`).update({
  'onboarding_state.completed_initial_tour': true,
  'onboarding_state.last_seen_at': new Date().toISOString(),
  'onboarding_state.module_welcomes_seen': firestore.FieldValue.arrayUnion(moduleId),
});
```

### Security rules
```js
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

## DynamoDB

```js
// Read
const result = await ddb.send(new GetItemCommand({
  TableName: 'Users',
  Key: { id: { S: userId } },
  ProjectionExpression: 'onboarding_state'
}));

// Write (update single field)
await ddb.send(new UpdateItemCommand({
  TableName: 'Users',
  Key: { id: { S: userId } },
  UpdateExpression: 'SET onboarding_state.completed_initial_tour = :t, onboarding_state.last_seen_at = :now',
  ExpressionAttributeValues: {
    ':t': { BOOL: true },
    ':now': { S: new Date().toISOString() }
  }
}));
```

## Redis (como cache, não persistência primária)

Se o estado é "quente" e você quer evitar hit no DB a cada navegação:

```js
const KEY = (userId) => `onboarding:${userId}`;
const TTL = 60 * 60 * 24; // 1 day

async function getCached(userId) {
  const cached = await redis.get(KEY(userId));
  if (cached) return JSON.parse(cached);
  const fresh = await db.getOnboardingState(userId);
  await redis.set(KEY(userId), JSON.stringify(fresh), 'EX', TTL);
  return fresh;
}

async function update(userId, patch) {
  const next = await db.updateOnboardingState(userId, patch);
  await redis.set(KEY(userId), JSON.stringify(next), 'EX', TTL);
}
```

Use Redis só se houver volume real — para a maioria dos produtos, o estado direto no DB é rápido o suficiente.

## localStorage (apps sem auth / fallback)

```js
const KEY = 'app-onboarding-state-v1';

export function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultOnboardingState();
    const parsed = JSON.parse(raw);
    return normalizeOnboardingState(parsed); // valida version
  } catch {
    return defaultOnboardingState();
  }
}

export function saveLocal(patch) {
  const current = loadLocal();
  const next = {
    ...current,
    ...patch,
    version: 1,
    last_seen_at: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
```

**Inclua o número da versão na chave** (`-v1`) — quando bumpar a versão do schema, mude a chave e ignore a antiga.

## Sincronização localStorage ↔ DB (apps híbridos)

Cenário: usuário começa anônimo (localStorage), depois loga e o estado precisa migrar para o DB.

Estratégia:
1. No login bem-sucedido, leia o estado do localStorage.
2. Leia o estado do DB.
3. Faça merge: para booleans, faça OR; para arrays, faça union; pegue o maior `last_seen_at`.
4. Salve o resultado no DB.
5. Limpe o localStorage.

```js
function mergeStates(local, remote) {
  return {
    version: Math.max(local.version, remote.version),
    completed_initial_tour: local.completed_initial_tour || remote.completed_initial_tour,
    dismissed_initial_tour: local.dismissed_initial_tour || remote.dismissed_initial_tour,
    module_welcomes_seen: [...new Set([...local.module_welcomes_seen, ...remote.module_welcomes_seen])],
    module_tours_seen: [...new Set([...local.module_tours_seen, ...remote.module_tours_seen])],
    last_seen_at: local.last_seen_at > remote.last_seen_at ? local.last_seen_at : remote.last_seen_at,
  };
}
```

## Considerações gerais

### Atomicidade
- Updates ao `OnboardingState` não precisam de transação distribuída — é estado não-crítico.
- Se houver race condition (duas abas atualizando simultaneamente), o "último a escrever ganha". Aceitável.

### Validação no boundary
Sempre passe o JSON pelo `normalizeOnboardingState()` ao ler do storage. Não confie em valores que vieram de fora:
- O usuário pode ter editado manualmente (DevTools no localStorage).
- A versão do schema pode ter sido atualizada no código mas não no DB.
- Migrações falhadas podem ter deixado lixo.

### Migração de schema
Quando bumpar `version`:
1. Atualize o helper `ONBOARDING_STATE_VERSION` no código.
2. O `normalizeOnboardingState()` retornará default para registros com versão diferente.
3. Usuários antigos verão o tour novo na próxima vez que entrarem.
4. **Não rode migration SQL** — o normalize cuida disso lazy. Simples e seguro.

### Privacidade e LGPD/GDPR
- O `OnboardingState` não contém dados pessoais nem PII. Não há requisitos especiais.
- Em export de dados do usuário (direito de portabilidade), inclua-o por padrão (faz parte da conta).
- Em deleção de conta, ele é apagado junto com o registro do usuário (cascade).

### Métricas e analytics
Se quiser instrumentar:
- `onboarding_initial_started`, `onboarding_initial_step_<n>`, `onboarding_initial_completed`, `onboarding_initial_dismissed`.
- `onboarding_module_welcome_seen`, `onboarding_module_tour_started`, `onboarding_module_tour_completed`.
- `onboarding_help_opened`, `onboarding_chat_query` (texto da query, sem PII).

Envie como eventos para sua plataforma de analytics existente (Mixpanel, Amplitude, PostHog, etc.). Não invente uma tabela só para isso.
