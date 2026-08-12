# Arquitetura e evidências do site

## Camadas

| Camada | Responsabilidade |
|---|---|
| public shell | header, footer, consentimento e assets |
| content registry | copy factual, FAQs e verticais |
| product evidence | capturas/versionamento e alt text |
| public catalog | planos, preços, limites e trial |
| acquisition state | UTM, segmento, plano e referral |
| analytics adapter | eventos internos e terceiros consentidos |
| auth bridge | signup/login/recuperação/verificação |

## Matriz de evidência

Antes de publicar, mantenha uma tabela:

| Alegação | Fonte | Evidência visual | CTA real | Estado |
|---|---|---|---|---|
| capacidade | documento/código | captura sanitizada | rota | validada |

Bloqueie alegações sem fonte atual.

## Checklist de captura

- ambiente demonstrativo ou dados fictícios;
- nenhum nome/documento/telefone/e-mail real;
- nenhuma imagem de cliente sem autorização;
- sem token, URL privada ou ID explorável;
- estado plausível e consistente;
- resolução e crop adequados;
- alt text descreve a função, não dados;
- versão/hash associado ao asset.

## Caminho crítico recomendado

1. HTML e CSS essenciais.
2. Fonte local com preload apenas do peso crítico.
3. Logo e imagem hero com dimensões.
4. JS de navegação/consentimento mínimo.
5. Analytics e mídia secundária após escolha/idle.

## Falha do catálogo

Se preço/trial não puder ser lido:

- mantenha copy e navegação;
- não publique número em cache antigo;
- esconda CTA que depender de plano inválido ou direcione a contato genérico;
- registre erro sem expor configuração;
- monitore a indisponibilidade.

## Governança

- copy de produto tem responsável e data de revisão;
- mudança visível atualiza a base factual;
- novo asset recebe versão;
- nova classe em CSS purgado exige rebuild;
- nova integração de marketing passa pelo gate de consentimento;
- capturas antigas são revisitadas após grandes mudanças de UI.
