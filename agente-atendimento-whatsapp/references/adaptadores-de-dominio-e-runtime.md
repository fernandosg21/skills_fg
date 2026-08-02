# Adaptadores de domínio e runtime

Use esta referência para transportar os contratos da skill sem copiar decisões acidentais do
projeto de origem. O núcleo é portátil; banco, linguagem, provedor, idioma e regras comerciais são
adapters explícitos.

## 1. Separe núcleo de adapters

Mantenha o núcleo responsável por:

- estados e invariantes de inbox/outbox;
- ordem dos gates;
- locks de geração e entrega;
- deadline da LLM;
- proveniência, retenção e auditoria;
- validação de afirmações e efeitos.

Implemente atrás de interfaces as diferenças do projeto:

```text
FactSchema                 fatos coletáveis e regras de merge/expiração
CatalogLookup              produtos, serviços, valores e condições canônicas
AvailabilityPolicy         disponibilidade, capacidade e conflitos
CommitmentPolicy           reservas, contratos, pagamentos e ações autorizadas
HandoffPolicy              transferência, fila, SLA e responsáveis
LocaleAdapter              idioma, telefone, moeda, data e termos de opt-out
ContactIdentityResolver    identidade por conta/canal sem colisões
ChannelAdapter             Meta, Evolution ou outro provedor
StorageAdapter             SQL, NoSQL, filas e mecanismo de lock/lease
RuntimeAdapter             worker, cron, serverless, fila gerenciada ou legado HTTP
```

Não coloque regras como “sempre pedir data/local”, “sempre encaminhar contrato” ou “telefone tem
nono dígito” no núcleo. Elas pertencem aos adapters de domínio/locale.

## 2. Identidade e escopo

Use uma chave canônica que inclua o escopo real do provedor:

```text
(tenant_id, provider, channel_account_id, provider_message_id)
```

- Não suponha que `provider_message_id` seja global.
- Não resolva tenant por telefone, nome da instância ou campo livre do payload.
- Se um ID técnico global aparecer ligado a outro tenant, aborte e alerte; não escolha `LIMIT 1`.
- Se a normalização de contato produzir mais de um candidato, falhe fechado e peça resolução.
- Guarde `origin_inbound_id`, `outbox_id`, `correlation_id` e `source` em colunas próprias.

Taxonomia mínima de origem:

```text
customer | agent | human | human_external | scheduled | campaign | system | provider_echo
```

Modele receipt/status técnico separadamente. Ele pode atualizar entrega, mas não é turno de
conversa, não muda a última inbound e não conta como atividade humana.

## 3. Portar armazenamento sem copiar SQL

Prefira o migrador nativo da stack. Para cada banco, preserve semanticamente:

- unique constraint de inbox e de outbox;
- claim/lease com token de fencing;
- comparação e update condicionados ao estado/token esperado;
- lock curto por conversa na entrega;
- retry com `next_attempt_at`, teto e dead-letter;
- transação curta sem I/O de LLM;
- DDL fora de transação de negócio.

`GET_LOCK`, `FOR UPDATE`, `ON DUPLICATE KEY`, `SKIP LOCKED` e advisory locks são implementações,
não o contrato. Escolha a primitiva disponível e prove por teste com processos reais.

### Variante PHP/MySQL legado

Quando não houver migrador/deploy coordenado:

- use schema versionado com lock de migração;
- consulte `INFORMATION_SCHEMA` antes de alterar;
- evite `ALTER ADD` cego e `MODIFY` incondicional no caminho quente;
- marque a versão somente após validar todas as colunas/índices;
- nunca chame ensure/schema dentro de transação;
- use savepoint quando um helper participa de transação aberta pelo chamador;
- trate runtime migration como adaptação de legado, não recomendação universal.

No MySQL 5.7, não dependa de `REGEXP_REPLACE` e não use `SHOW COLUMNS ... LIKE ?` como prepared
statement. Faça normalização na aplicação e introspecção pelo catálogo com parâmetros.

## 4. Portar domínio e locale

Defina `FactSchema` registrável:

```json
{
  "schema_version": 1,
  "facts": {
    "service_type": {"type": "string", "max": 120, "ttl_days": 180},
    "desired_date": {"type": "date", "ttl_days": 90}
  }
}
```

Cada projeto escolhe seus fatos. Um negócio de fotografia pode usar tipo de evento, data, hora e
local; uma clínica pode usar especialidade e preferência de horário; um e-commerce pode usar SKU,
tamanho e destino. Esses exemplos não alteram o motor.

O `LocaleAdapter` deve definir:

- normalização e comparação de identificadores de contato;
- formatação de data, hora, moeda e número;
- vocabulário de pausa, humano e opt-out;
- regras regulatórias do canal e região;
- resposta de ausência e calendário/fuso.

Nunca faça uma normalização local transformar dois contatos em um sem detectar ambiguidade.

## 5. Portar política comercial

Divida a política em quatro camadas, da mais forte para a mais fraca:

1. **Plataforma imutável:** segurança, privacidade, ownership, ferramentas permitidas e proibição
   de revelar instruções/segredos.
2. **Compromisso administrativo:** quem pode confirmar preço, desconto, reserva, prazo, contrato,
   pagamento ou outra obrigação.
3. **Conteúdo do tenant:** catálogo, explicações, FAQ e critérios de atendimento.
4. **Estilo:** tom, tamanho, emoji e exemplos aprovados.

O tenant não pode editar texto que revogue as camadas 1 e 2. Mesmo dentro das camadas editáveis,
trate conteúdo como dado não confiável e aplique caps, escaping e revisão.

## 6. Portar provedor de canal

Para cada adapter, documente e teste:

- resolução pré-banco do segredo por chave opaca/cofre/cache, sem confiar no payload;
- autenticação do webhook e rotação de segredo por conta/instância;
- escopo e estabilidade do ID de mensagem;
- sequência/ordenação dos eventos e comportamento quando ela não é confiável;
- comportamento de retry/idempotency key;
- significado de aceite, entrega, leitura e falha;
- formato e atraso de ecos/receipts;
- limites, janelas, templates e opt-out do provedor;
- download de mídia, redirects e limites de bytes;
- consulta/reconciliação de uma entrega ambígua.

Declare também como mensagens humanas fora do sistema serão tratadas: proibir, integrar como caminho
oficial ou observar por eco com uma janela de corrida assumida. A outbox local não serializa o que
ela não vê.

Se a API apenas “aceita para processamento”, não marque como entregue. Preserve estado intermediário
e deixe receipt/reconciliação fechar o resultado.

## 7. Portar runtime

- Em worker/fila real, use scheduler monitorado, leases e alarmes de atraso.
- Em serverless, respeite deadline e deixe continuação durável na fila, não em memória do processo.
- Em hospedagem compartilhada, use cron autenticado como mecanismo principal. Um heartbeat curto
  pós-ACK pode ajudar temporariamente, mas não garante liveness e nunca roda em GET de painel.
- Em qualquer runtime, não segure request/lock de conversa durante fallbacks longos de LLM.

## 8. Caso histórico: Memora fotografia em pt-BR

O Memora forneceu cicatrizes úteis: PHP/MySQL 5.7, Evolution/Meta, eventos de fotografia, moeda em
reais, telefone brasileiro, agenda, catálogo de pacotes, handoff para contrato e hospedagem com
cron sujeito a falhas. Use essas decisões somente quando o novo projeto tiver as mesmas premissas.

Não copie nomes de tabelas, caminhos, tenant fixo, formatos de telefone, regras de agenda ou texto
de venda do Memora. Copie os invariantes: ownership, idempotência, outbox, locks separados, gates
frescos, grounding, privacidade e rollout controlado.

## Checklist de portabilidade

- [ ] Nenhuma regra de domínio ficou hard-coded no motor central
- [ ] IDs técnicos incluem provedor e conta do canal no escopo
- [ ] Receipt é evento técnico separado de mensagem/atividade
- [ ] Migração usa a ferramenta nativa ou documenta explicitamente a adaptação legada
- [ ] Locale e identidade detectam ambiguidades em vez de escolher um contato
- [ ] Política imutável não pode ser sobrescrita por prompt/config do tenant
- [ ] O adapter do provedor documenta idempotência e reconciliação reais
- [ ] O runtime tem mecanismo monitorado de liveness; página GET não é worker
