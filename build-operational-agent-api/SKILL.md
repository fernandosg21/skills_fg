---
name: build-operational-agent-api
description: "Implemente ou audite uma API por token para um agente operacional executar tarefas internas com conta própria, escopos granulares, rate limit, ownership multi-tenant, idempotência, upload seguro e auditoria. Use quando conectar Cowork, automação desktop ou outro agente a entregas, galerias, seleção de fotos e etapas sem conceder sessão de administrador."
---

# Construir API para agente operacional

## Objetivo

Ofereça automação limitada e auditável a uma identidade de colaborador, com caminho simples de ativação e sem permitir que o agente fale com clientes, apague dados ou atravesse tenants.

## Defina o agente e o playbook

- Crie uma conta de colaborador dedicada; não compartilhe o login do administrador.
- Declare no manual identidade, tarefas permitidas, proibições e pontos de escalada humana.
- Separe preparação operacional de comunicação externa e decisões irreversíveis.
- Faça a API complementar o navegador, não substituir controles que ainda exigem revisão humana.
- Leia [token-escopos-e-endpoints.md](references/token-escopos-e-endpoints.md).

## Crie ativação segura e simples

- Ofereça tela administrativa para escolher a conta, marcar permissões, gerar/rotacionar e desativar a chave.
- Mostre o token completo uma única vez.
- Gere segredo aleatório forte; inclua prefixo de tenant somente para lookup, nunca como autorização.
- Guarde hash/verificador ou segredo em cofre adequado e compare em tempo constante.
- Rotacionar invalida imediatamente o token anterior.
- Faça gate de módulo/plano existir na tela e no bootstrap da API.

## Autentique e autorize cada endpoint

1. Extraia token de header; evite query string, salvo compatibilidade GET consciente e redigida em logs.
2. Valide formato e resolva candidato a tenant.
3. Busque integração ativa daquele tenant e compare o token.
4. Confirme usuário agente ativo e papel permitido.
5. Carregue os escopos do token.
6. Exija escopo específico do endpoint.
7. Aplique rate limit por tenant, token/usuário e classe de operação.

Responda JSON consistente `{ok:true,...}` ou `{ok:false,error,...}` sem mensagem interna bruta.

## Faça ownership em profundidade

- Toda query de evento, fluxo, galeria, foto e etapa inclui tenant.
- Ao atravessar outro banco/subsistema, confirme o tenant dos dois lados.
- Não aceite ID técnico global como prova de ownership.
- Não ofereça fallback para configuração global sensível quando faltar configuração tenant/user.
- Para endpoint público ou arquivo, gere autorização curta e restrita ao recurso.

## Projete endpoints idempotentes

- Leituras: pendências, status e exportações paginadas/limitadas.
- Criação: use chave de negócio para “garantir galeria”, retornando a existente em retry.
- Atualização: valide matriz de estado e grave antes/depois.
- Upload: hash + nome como sinais, MIME real e processamento compartilhado com a UI.
- Nunca copie o pipeline de imagem; extraia helper usado por controller e API.
- Se filesystem/storage compartilhado for premissa e não estiver disponível, falhe fechado com 503 e oriente usar a UI.

## Registre auditoria

- Grave tenant, agent_user, action, entidade, ID, metadados mínimos, origem `agent_api` e horário.
- Faça auditoria best-effort sem derrubar uma ação já válida, mas alerte operacionalmente sobre falha persistente.
- Não registre token, conteúdo integral de arquivo, PII desnecessária ou resposta de provedor.
- Instrumente também as mesmas mutações feitas por humanos para comparar origem.

## Limite ações destrutivas

- Não exponha exclusão permanente no primeiro desenho.
- Exija escopo separado e confirmação humana para envio a cliente, publicação ou fechamento financeiro.
- Prefira estados reversíveis e idempotentes.
- Se uma etapa atualizada tiver efeitos laterais, chame o mesmo serviço de domínio da UI.
- Preserve seleção/export antes de marcar etapa concluída.

## Valide

- Teste token ausente, malformado, expirado/rotacionado e de outro tenant.
- Teste cada escopo permitido e negado.
- Teste conta desativada e módulo desligado.
- Reexecute create/update/upload e prove idempotência.
- Teste arquivo hostil, duplicado e storage indisponível.
- Inspecione auditoria e ausência de segredo/PII.
- Teste concorrência e rate limit por classe.
- Faça smoke real controlado de upload antes de declarar essa capacidade pronta.

## Critérios de conclusão

Considere pronto quando o agente possui menos privilégio que um administrador, cada mutação é atribuível e repetir uma chamada não duplica galeria, foto, etapa ou efeito lateral.
