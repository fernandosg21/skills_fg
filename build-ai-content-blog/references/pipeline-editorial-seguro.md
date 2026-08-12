# Pipeline editorial seguro

## Estados sugeridos

`pauta -> gerando -> pendente_revisao -> agendado/publicado`

Saídas laterais: `erro`, `rejeitado`, `arquivado`.

## Pipeline

1. Reivindicar pauta idempotentemente.
2. Selecionar tipo, tom e contexto curado.
3. Montar prompt + schema.
4. Chamar router LLM.
5. Validar estrutura e semântica.
6. Fazer retry guiado ou fallback.
7. Sanitizar regras duras.
8. Persistir rascunho estruturado.
9. Notificar revisão autenticada.
10. Publicar/agendar somente após decisão humana.

## Fonte de verdade

Mantenha um registro fixo `area -> arquivos permitidos`. O loader não recebe caminho arbitrário. Para endpoint público usado por automação, exponha apenas texto já público, com `noindex` e sem segredo na query string.

## Render allowlist

Permita estruturas conhecidas, por exemplo:

- títulos H2/H3;
- parágrafos;
- `strong` controlado;
- listas e itens;
- FAQ em campos próprios.

Escape todo texto. Não aceite `raw_html` do modelo.

## Validação bloqueante

- schema completo;
- pelo menos duas seções relevantes;
- produto citado quando o tipo exigir;
- última seção de solução quando aplicável;
- nenhum fato fora da base;
- nenhum item proibido pela marca.

## Aprovação

E-mail é aviso. A ação acontece apenas em painel autenticado com CSRF e auditoria. Links públicos de aprovação transformam encaminhamento/vazamento em permissão editorial e devem ser evitados.
