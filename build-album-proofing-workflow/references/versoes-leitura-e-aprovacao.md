# Versões, leitura e aprovação

## Entidades mínimas

| Entidade | Campos essenciais |
|---|---|
| projeto | tenant, cliente, estado, versão atual |
| versão | projeto, número, publicada em, congelada em |
| lâmina | versão, asset, posição, tipo capa/lâmina |
| comentário | versão, lâmina, autor, texto, estado |
| leitura | versão, chave do leitor, lâmina, primeiro/último acesso, duração |
| aprovação | versão, ator, aceite, evidências, horário |

## Invariantes

- Uma aprovação pertence a uma única versão.
- Uma versão aprovada não é reescrita.
- Capa não participa do reorder de lâminas.
- Comentário nunca migra silenciosamente para outra versão.
- Reprocessar o evento de aprovação não cria dois pedidos.

## Chave de leitura

Use uma chave que sobreviva à sessão e possa ser migrada de visitante público para cliente cadastrado. Faça a migração antes de calcular o resumo final da aprovação.

## Evidência sugerida

- versão e hash do conjunto de assets;
- texto e versão do aceite;
- nome/ID do aprovador;
- timestamp e fuso;
- páginas vistas e puladas;
- confirmação explícita quando havia páginas não vistas;
- IP mascarado ou outra evidência proporcional, conforme política de privacidade.

## Concorrência

Ao aprovar, trave projeto/versão, confirme que ela ainda é a versão publicada atual e só então grave a aprovação. Uma nova versão criada simultaneamente não pode receber a aprovação destinada à anterior.
