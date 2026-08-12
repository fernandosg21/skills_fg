# Estados, consentimentos e notas

## Estados da edição

`draft -> submissions_open -> judging -> concluded`

Valide também datas; um estado aberto fora da janela não deve aceitar envio.

## Consentimentos separados

- responsabilidade legal;
- aceite do regulamento versionado;
- avaliação e armazenamento internos;
- declaração de inscrição única, se aplicável;
- publicação pública opcional e revogável.

Não agrupe o consentimento opcional de publicação com os obrigatórios.

## Matemática

Para uma foto:

`nota_foto = média das avaliações regulares daquela foto`

Para um conjunto:

`nota_conjunto = média das notas das fotos pontuadas do conjunto`

Não calcule o conjunto diretamente sobre todas as linhas de avaliação quando números de jurados por foto puderem diferir.

## Desempate

- papel/rodada separados;
- grupo de entrada reproduzível;
- notas fora das médias oficiais, salvo se o regulamento disser o contrário;
- publicação somente depois de decisão final.

## Autorização de imagem

Verifique em todas as saídas:

`authorized_at IS NOT NULL && revoked_at IS NULL`

Use a condição no backend de imagem, exportação, ZIP, resultados e metadados.
