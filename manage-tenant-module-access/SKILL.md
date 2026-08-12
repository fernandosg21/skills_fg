---
name: manage-tenant-module-access
description: "Cria ou audita um controle central de acesso a módulos por tenant, com registry declarativo, modos `public`, `off` e `exclusive`, defaults seguros, migração de flags/env legadas, gestão administrativa, auditoria, cache leve e gates coerentes em páginas, APIs, menus, jobs e links públicos. Use para feature gates permanentes, módulos beta, pilotos por cliente, rollout exclusivo ou quando uma função aparece na UI mas continua acessível pelo backend."
---

# Controle de módulos por tenant

Centralize a decisão de disponibilidade. Um módulo não deve ter listas divergentes em página, API, menu e cron.

## Definir o contrato

Manter um registry equivalente a:

```text
module_key -> label, description, type, allowed_modes, default_mode, legacy_source?
```

Modos canônicos:

- `public`: todos os tenants elegíveis.
- `off`: nenhum tenant.
- `exclusive:<ids>`: somente a allowlist explícita.

Use `type=single` quando só um tenant puder operar o módulo; nesse caso normalize para um único ID. Um módulo novo e arriscado deve nascer desligado ou exclusivo, nunca aberto por acidente.

## Resolver acesso

1. Validar a chave contra o registry; chave desconhecida falha `off`.
2. Ler todas as configurações persistidas em uma consulta leve por request.
3. Se houver valor válido no banco, fazê-lo vencer a fonte legada.
4. Usar env/flag antiga apenas durante migração compatível.
5. Sem valor persistido ou legado válido, usar `default_mode` do registry.
6. Expor `mode`, `tenant_ids` e `source` para diagnóstico, mas nunca segredo.
7. Limpar o cache depois de uma alteração administrativa.

Leia [matriz-de-gates.md](references/matriz-de-gates.md) antes de considerar um módulo coberto.

## Aplicar o gate em todas as superfícies

- Página: verificar após autenticação e antes de consultas/efeitos.
- API: repetir o gate no backend e devolver 403; a página não é barreira.
- Menu desktop/mobile: refletir o mesmo resolvedor, falhando fechado.
- Job/tick/cron: pular tenants não autorizados antes de claim, DDL ou I/O externo.
- Webhook: quando o efeito depende do módulo, aplicar depois de autenticar/resolver tenant e antes do efeito.
- Link público já emitido: decidir explicitamente se deve continuar funcionando. Se continuidade for necessária, gatear a criação/automação e preservar a resposta pública.
- Dados históricos: desligar módulo não implica apagar registros.

## Painel administrativo

- Exigir superadmin, POST e CSRF em toda mutação.
- Listar definição, estado efetivo, fonte e tenants exclusivos.
- Validar modos permitidos pelo módulo e existência/elegibilidade dos tenants.
- Ao mudar `public` para `exclusive` ou `off`, mostrar impacto e exigir confirmação.
- Persistir uma única string/estrutura canônica e registrar ator, antes/depois e horário.
- Nunca colocar chave de API ou segredo na mesma estrutura de acesso.

## Performance e migração

- O caminho de leitura deve ser somente SELECT, cacheado por request e tolerante a indisponibilidade conforme o default seguro.
- Não carregar o billing inteiro nem executar DDL para decidir se uma página abre.
- Migrar cada env legado para uma entrada no registry; manter fallback temporário até provar paridade.
- Não criar um env novo para cada módulo depois da centralização.
- Separar feature flag experimental com percentual de um gate de produto por tenant. Se precisar dos dois, resolver plano/flag/módulo em políticas distintas e explicitar a precedência.

## Testes

- Chave desconhecida e valor inválido falham fechado.
- Banco vence env; ausência de ambos usa o default.
- Public/off/exclusive funcionam para tenant permitido e negado.
- `single` recusa múltiplos IDs.
- Página, API, menus desktop/mobile, cron e chamada direta têm paridade.
- Alterar configuração invalida cache no mesmo request.
- Desligar não apaga dados e não ressuscita por fallback legado.
- Link público preservado segue a decisão documentada.

## Entrega

Produzir registry único, resolvedor barato, APIs administrativas, auditoria, matriz de gates preenchida e testes de paridade. Registrar exceções públicas deliberadas e o plano para remover fontes legadas.
