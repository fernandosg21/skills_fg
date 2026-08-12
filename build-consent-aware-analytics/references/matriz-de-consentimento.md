# Matriz de consentimento

## Categorias

| Categoria | Exemplos | Antes do aceite |
|---|---|---|
| necessário | sessão, CSRF, segurança, preferência de consentimento | permitido conforme política |
| analytics | GA, métricas de navegação opcionais | não carregar/disparar |
| marketing | Meta Pixel, ads, remarketing | não carregar/disparar |

Classifique cada tag individualmente, inclusive dentro do GTM.

## Evento local sugerido

```json
{
  "event": "consent_changed",
  "analytics": true,
  "marketing": false
}
```

Empurre o estado ao dataLayer antes de `gtm.start` e em mudanças posteriores.

## Allowlist de propriedades

Exemplo de conversão de cadastro:

- permitido: `event_id`, método categórico, campanha opaca;
- proibido: e-mail, telefone, nome, documento, endereço, tenant ID, plano/valor sem necessidade aprovada.

## Checklist de rede

- sem consentimento: nenhum request a Google/Meta/ads;
- analytics apenas: somente destinos classificados como analytics;
- marketing apenas: somente destinos autorizados pela política escolhida;
- ambos: todos os destinos esperados, uma vez;
- revogação: novos eventos bloqueados e próxima navegação limpa.

## Separação de propriedades

Use propriedades distintas quando site público e painel autenticado têm finalidade/população diferentes. Documente qualquer exceção sem gate e valide se ela é realmente necessária, não apenas legado.
