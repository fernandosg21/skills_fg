# Fluxo e ameaças do link de orçamento

## Fluxo canônico

1. Operador escolhe pacote tenant-scoped.
2. Servidor resolve ou cria token público opaco.
3. Servidor assina desconto ou valor final autorizado.
4. Operador copia o link.
5. Visitante abre e o servidor resolve pacote + tenant.
6. Visitante responde.
7. Backend atualiza CRM, interação e follow-up idempotente.
8. Analytics registra eventos separados.

## Ameaças e controles

| Ameaça | Controle |
|---|---|
| Enumeração de pacotes | token aleatório; não aceitar ID público como autoridade |
| Alteração de preço | HMAC e recálculo server-side |
| Vazamento de cliente | metatags genéricas e resposta mínima |
| Colisão entre tenants | token global único e ownership em toda escrita |
| Spam de respostas | rate limit, validação e observabilidade |
| Duplicação no CRM | chave idempotente e lookup dentro do tenant |
| Regressão do funil | transições monotônicas ou matriz explícita |

## Payload assinado sugerido

- versão do formato;
- ID interno ou token do pacote;
- tenant derivável, nunca confiado isoladamente;
- tipo de ajuste: percentual ou valor final;
- valor em centavos;
- emitido em e expiração, se o negócio exigir;
- nonce opcional para revogação granular.

Compare assinaturas em tempo constante.
