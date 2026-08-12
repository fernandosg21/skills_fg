# Fases e reconciliação

## Grafo típico

1. tenant e perfil;
2. usuários/memberships;
3. catálogos e configurações;
4. clientes/leads/parceiros;
5. eventos/contratos;
6. parcelas, movimentos e custos;
7. equipe e convites;
8. entregas, galerias, álbuns e seleções;
9. conversas, follow-ups e notificações;
10. arquivos e artefatos;
11. integrações, jobs e tokens regenerados.

Adapte ao schema real e derive dependências de foreign keys e código, não apenas do nome das tabelas.

## Manifest mínimo

- format_version;
- source_system e source_schema_version;
- source_tenant_id e export_id;
- exported_at e cutoff_at;
- lista de conjuntos com contagem e checksum;
- lista de arquivos com tamanho/hash;
- política de segredos/tokens;
- ferramentas/versões usadas;
- assinatura do pacote.

## Estados da execução

planned -> validated -> importing -> reconciling -> ready_for_cutover -> cutover -> monitoring -> completed

Saídas controladas: failed, rolled_back e needs_review.

## Relatório de dry-run

Para cada tipo:

- criar;
- vincular por ID explícito;
- conflito resolvível;
- conflito ambíguo;
- bloqueado;
- ignorado por política.

Mostre exemplos limitados e sanitizados, nunca despeje PII em log.

## Evidências de reconciliação

| Área | Evidência |
|---|---|
| identidade | tenants, usuários e memberships esperados |
| CRM | contagens por estágio e relações sem órfão |
| eventos | contagens por estado e cliente válido |
| financeiro | somas por moeda/status e razão balanceada |
| arquivos | todos os hashes e referências |
| público | tokens/slugs únicos e URLs funcionais |
| integrações | IDs externos sem dono ambíguo |
| isolamento | testes negativos entre tenants |

## Rollback

Rollback deve declarar:

- ponto de decisão;
- como restaurar roteamento;
- como desfazer apenas escritas da migration_run;
- como tratar eventos novos depois do cutover;
- quem autoriza;
- quando a origem pode sair do modo preservado.
