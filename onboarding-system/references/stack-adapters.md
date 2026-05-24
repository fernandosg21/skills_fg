# Adaptadores por stack

Como mapear a arquitetura comum para diferentes frameworks. Para cada stack: lib de tour recomendada, ponto de integração do provider, padrão para o FAB, e particularidades.

## Tabela rápida — bibliotecas de tour

| Stack | Lib recomendada | Tamanho | Por quê |
|-------|-----------------|---------|---------|
| **React 17+** (qualquer meta-framework) | **Driver.js** | ~5kb | Vanilla, agnóstico, sem incompatibilidade com versões de React |
| **React 16-18 conservador** | **react-joyride** | ~30kb | API React-first, mais componentes prontos. Cuidado com React 19. |
| **Vue 3** | **vue3-tour** ou **Driver.js** | 8kb / 5kb | Driver.js também funciona perfeitamente. Use-o se quer 1 lib comum. |
| **Vue 2** | **vue-tour** | 12kb | Lib dedicada Vue 2, manutenção em modo conservador. |
| **Angular** | **ngx-guided-tour** ou **Driver.js** | 20kb / 5kb | Driver.js também funciona — basta dar `ngAfterViewInit` para iniciar. |
| **Svelte/SvelteKit** | **Driver.js** | 5kb | Não há lib Svelte-nativa popular; Driver.js plugá direto via action. |
| **Server-rendered (Rails/Django/Laravel/PHP)** | **Driver.js** ou **Shepherd.js** | 5kb / 30kb | Carregue via `<script>` no layout autenticado. |
| **HTMX / Alpine.js** | **Driver.js** | 5kb | Compatibilidade total via JS direto. |
| **Bootstrap puro / jQuery legacy** | **Bootstrap Tour** ou **Driver.js** | 15kb / 5kb | Bootstrap Tour combina visualmente, Driver.js é mais moderno. |

**Default**: Driver.js. Só mude se houver razão concreta (incompatibilidade, lib já instalada, restrição corporativa).

## React / Next.js

### Provider
- Crie um `OnboardingProvider` usando `createContext` + `useState`.
- Em Next.js App Router: o estado inicial vem de um server component (layout), passado como prop. Marque o provider com `'use client'`.
- Em Next.js Pages Router ou CRA: busque o estado via fetch/SWR no mount; mostre fallback enquanto carrega.

### Onde renderizar os 3 componentes
Em Next.js App Router, dentro do `app/(authenticated)/layout.tsx`:

```tsx
export default async function Layout({ children }) {
  const initialState = await getOnboardingState();
  return (
    <OnboardingProvider initialState={initialState}>
      <Sidebar />
      <main>{children}</main>
      <InitialTour />
      <ModuleWelcome />
      <HelpFab />
    </OnboardingProvider>
  );
}
```

### Driver.js no React
```tsx
'use client';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useEffect } from 'react';

useEffect(() => {
  if (!shouldStart) return;
  const d = driver({
    showProgress: true,
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Concluir',
    steps: [
      { element: '[data-onboarding="dashboard-metrics"]', popover: { title: 'Seus indicadores', description: '...' } },
      ...
    ],
    onDestroyed: (el, step, opts) => {
      const isLast = opts.state.activeIndex === opts.config.steps.length - 1;
      update(isLast ? { completed_initial_tour: true } : { dismissed_initial_tour: true });
    },
  });
  d.drive();
  return () => d.destroy();
}, [shouldStart]);
```

### Server actions vs API routes
- App Router: use **server actions** (`'use server'`) para `updateOnboardingState`. Mais leve que API routes.
- Pages Router: use API routes (`pages/api/onboarding.ts`) ou hooks com `useSWRMutation`.

### FAB com Tailwind
```tsx
<button
  data-onboarding="help-fab"
  aria-label="Abrir central de ajuda"
  onClick={openHelp}
  className="fixed right-4 bottom-24 lg:bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
>
  <HelpCircle className="h-6 w-6" />
</button>
```

## Vue 3 / Nuxt

### Provider
- Use `provide`/`inject` ou um store Pinia para o `OnboardingState`.
- Componente raiz `<OnboardingProvider>` que carrega o estado inicial via `useFetch`/`useAsyncData` (Nuxt) ou Pinia action no mount (Vue puro).

### Onde renderizar
Em Nuxt, no `layouts/default.vue`:

```vue
<template>
  <OnboardingProvider>
    <Sidebar />
    <slot />
    <InitialTour />
    <ModuleWelcome />
    <HelpFab />
  </OnboardingProvider>
</template>
```

### Driver.js no Vue
```vue
<script setup>
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { onMounted, onUnmounted, watch } from 'vue';

const { state, activeTour, update } = useOnboarding();
let driverInstance = null;

watch(activeTour, (tour) => {
  if (!tour) {
    driverInstance?.destroy();
    return;
  }
  driverInstance = driver({ steps: buildSteps(tour), /* ... */ });
  driverInstance.drive();
});
</script>
```

## Angular

### Provider
- Use um `@Injectable({ providedIn: 'root' })` `OnboardingService` que mantém o estado em `BehaviorSubject<OnboardingState>`.
- Carregue o estado inicial no `APP_INITIALIZER` (factory provider).

### Onde renderizar
No `app.component.html` ou no layout autenticado:

```html
<app-sidebar></app-sidebar>
<router-outlet></router-outlet>
<app-initial-tour></app-initial-tour>
<app-module-welcome></app-module-welcome>
<app-help-fab></app-help-fab>
```

### Driver.js no Angular
```ts
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

ngOnInit() {
  this.onboarding.state$.pipe(filter(s => shouldShowInitialTour(s)), take(1))
    .subscribe(() => {
      setTimeout(() => this.startTour(), 800);
    });
}

startTour() {
  const d = driver({ steps: [...], onDestroyed: () => this.onboarding.markCompleted() });
  d.drive();
}
```

## Server-rendered (Rails/Django/Laravel/ASP.NET/PHP)

### Estratégia geral
- O `OnboardingState` é renderizado pelo backend como JSON num `<script id="onboarding-state" type="application/json">{...}</script>` no layout autenticado.
- Um script JS (`onboarding.js`) lê esse JSON e expõe um objeto `window.Onboarding` com `state`, `update`, `startInitialTour`, etc.
- Os componentes UI são **HTML + Driver.js** controlados pelo `window.Onboarding`.
- `update(patch)` faz um `fetch('/api/onboarding', { method: 'PATCH', body: JSON.stringify(patch) })` que persiste no servidor.

### Estrutura sugerida (Rails / Django / Laravel)
```
public/onboarding/
├── onboarding.js          # entrypoint: define window.Onboarding
├── onboarding.css         # estilos do FAB e painel
├── help-panel.html        # template do painel (carregado via innerHTML)
└── ONBOARDING.md          # guia (servido estaticamente)

backend:
├── routes/onboarding      # GET /api/onboarding, PATCH /api/onboarding
└── migrations/            # adicionar campo onboarding_state à tabela users
```

### Exemplo Laravel
```php
// routes/api.php
Route::middleware('auth')->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'show']);
    Route::patch('/onboarding', [OnboardingController::class, 'update']);
});

// app/Http/Controllers/OnboardingController.php
public function show(Request $request) {
    return response()->json($request->user()->onboarding_state ?? []);
}

public function update(Request $request) {
    $user = $request->user();
    $current = $user->onboarding_state ?? [];
    $user->onboarding_state = array_merge($current, $request->validated(), [
        'version' => 1,
        'last_seen_at' => now()->toIso8601String(),
    ]);
    $user->save();
    return response()->json($user->onboarding_state);
}
```

### Exemplo Django
```python
# views.py
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
import json

@login_required
@require_http_methods(["GET", "PATCH"])
def onboarding(request):
    if request.method == "GET":
        return JsonResponse(request.user.onboarding_state or {})
    patch = json.loads(request.body)
    state = {**(request.user.onboarding_state or {}), **patch,
             "version": 1, "last_seen_at": timezone.now().isoformat()}
    request.user.onboarding_state = state
    request.user.save(update_fields=["onboarding_state"])
    return JsonResponse(state)
```

### Exemplo Rails
```ruby
# config/routes.rb
namespace :api do
  resource :onboarding, only: [:show, :update]
end

# app/controllers/api/onboarding_controller.rb
class Api::OnboardingController < ApplicationController
  before_action :authenticate_user!

  def show
    render json: current_user.onboarding_state || {}
  end

  def update
    current = current_user.onboarding_state || {}
    next_state = current.merge(params.permit!.to_h)
                        .merge(version: 1, last_seen_at: Time.current.iso8601)
    current_user.update!(onboarding_state: next_state)
    render json: next_state
  end
end
```

## SPA sem backend (estático, JAMstack)

Se o produto não tem usuário logado (ex: landing tool, calculadora pública), persista em `localStorage`:

```js
const KEY = 'app-onboarding-state-v1';

function getState() {
  try { return JSON.parse(localStorage.getItem(KEY)) || defaultState(); }
  catch { return defaultState(); }
}

function setState(patch) {
  const next = { ...getState(), ...patch, version: 1, last_seen_at: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
```

Trade-off conhecido: ao trocar de navegador/dispositivo o tour reaparece. Aceitável para produtos sem login.

## Mobile (React Native / Flutter / Native)

Esta skill foca em **web**. Para apps nativos, a arquitetura conceitual é a mesma (5 componentes, mesmo state), mas as ferramentas mudam:
- React Native: `react-native-copilot`, `react-native-spotlight-tour`.
- Flutter: `tutorial_coach_mark`, `showcaseview`.
- iOS nativo: `Instructions`.
- Android nativo: `MaterialShowcaseView`, `Spotlight`.

Adapte o guia em markdown para uma tela "Ajuda" nativa renderizada com componente Markdown da plataforma.

## Checklist de adaptação ao stack

Antes de codar, confirme:

- [ ] Identifiquei o framework e a versão exata (importante para escolher a lib).
- [ ] Há uma área "autenticada" / "logged-in" claramente delimitada no layout.
- [ ] Sei onde mora a tabela/coleção de usuários para adicionar `onboarding_state`.
- [ ] Sei como o produto identifica o usuário em cada request (sessão? JWT? cookie?).
- [ ] Sei o padrão de estilização e o sistema de cores/tema do produto.
- [ ] Conferi se a lib escolhida não tem incompatibilidade com a versão do framework.
- [ ] Sei onde adicionar uma rota/endpoint estático para servir o `ONBOARDING.md`.
