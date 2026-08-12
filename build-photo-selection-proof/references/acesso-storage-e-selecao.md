# Acesso, storage e seleção

## Camadas de arquivo

| Camada | Uso | Exposição |
|---|---|---|
| original | arquivo preservado | somente rota autorizada |
| preview | navegação do cliente | token + política de galeria |
| thumbnail | grade rápida | token + política de galeria |
| export | ZIP/lista temporária | URL assinada e expiração curta |

## Estados por foto

`recebida -> validada -> processando -> pronta`

Permita `erro` com retry. Não publique a galeria como completa enquanto houver arquivos obrigatórios em estado intermediário.

## Operação atômica de seleção

1. Resolva galeria e cliente/acesso.
2. Trave a linha/contador relevante.
3. Verifique estado não finalizado.
4. Conte seleções ativas.
5. Insira ou remova idempotentemente.
6. Confirme `count <= limit`.
7. Retorne contagem oficial.

Uma constraint única por galeria + foto + seletor evita duplicar o mesmo favorito.

## Snapshot de finalização

Grave:

- versão da seleção;
- IDs e nomes dos arquivos em ordem;
- limite/origem contratual;
- total escolhido;
- ator e acesso utilizado;
- data/hora;
- hash do conjunto opcional.

Reabrir cria uma nova rodada; não apaga a evidência da rodada anterior.
