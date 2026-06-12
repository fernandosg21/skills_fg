---
name: separar-arte-em-camadas-psd
description: Separar artes achatadas PNG/JPG em camadas rasterizadas e entregar um PSD organizado, preservando dimensões, reconstruindo fundo, isolando textos, molduras, fotos, ornamentos, sombras e referências visuais. Use quando o usuário pedir PSD em camadas, template editável a partir de imagem, separação de elementos ou limpeza de fundo de uma arte pronta.
---

# Skill: Separar Arte Achatada em Camadas PSD

Use esta skill quando o usuário enviar uma arte pronta em PNG/JPG/JPEG e pedir para separar em camadas, recriar como template, entregar PSD, isolar textos/fotos/ornamentos ou limpar o fundo.

## Resultado esperado

Entregar um arquivo `.psd` com camadas rasterizadas, nomeadas e organizadas. A composição visual do PSD deve ficar o mais próxima possível da imagem original.

Padrão de camadas recomendado:

1. `00_Referencia_original` — imagem original para conferência, preferencialmente oculta no PSD.
2. `01_Fundo_limpo` — fundo reconstruído sem os elementos removíveis.
3. `02_Ornamentos` — linhas, corações, brilhos, arabescos e detalhes decorativos.
4. `03_Textos_superiores` — textos/legendas da parte superior ou central.
5. `04_Foto_ou_moldura_superior` — molduras, placeholders, sombras, clipes e papéis.
6. `05_Foto_ou_moldura_inferior` — segunda moldura/placeholder, sombras e fitas.
7. `06_Textos_principais` — título, subtítulo, copy e chamadas.
8. Outras camadas conforme a arte exigir: `Logo`, `Produto`, `Sombra`, `Textura`, `Personagem`, `CTA`, `Icones`.

Importante: quando a origem é uma imagem achatada, as camadas separadas são rasterizadas. Só prometa texto/vetor editável se você realmente recriar os textos ou formas.

## Fluxo obrigatório

### 1. Auditar a arte visualmente

Identifique:

- dimensões exatas da imagem;
- grupos visuais principais;
- textos, fotos, molduras, ornamentos, sombras e texturas;
- áreas que precisam de fundo reconstruído;
- elementos que devem ficar juntos, como polaroid + sombra + clipe, ou fita + moldura.

Crie um mapa de camadas antes de começar.

### 2. Criar máscaras por grupo

Combine técnicas conforme a arte:

- **Objetos grandes**: máscaras manuais por polígonos/retângulos, com feather suave.
- **Textos escuros**: máscara por contraste local/luminância dentro de regiões delimitadas.
- **Ornamentos dourados/coloridos**: máscara por HSV/cor, limitada a regiões específicas para não capturar textura de fundo.
- **Fotos/placeholders**: máscara por forma geométrica da moldura + sombra + acessórios.
- **Elementos pequenos**: máscara por cor, contraste ou seleção manual refinada.

Sempre salve as camadas em PNG de canvas completo, com transparência, para manter alinhamento perfeito no PSD.

### 3. Reconstruir o fundo limpo

Remova os elementos usando uma combinação de:

- inpainting para textos, linhas finas e detalhes pequenos;
- preenchimento direcional ou amostragem lateral para áreas grandes, como molduras/fotos;
- blur leve e reintegração de textura para evitar manchas lisas demais;
- feather nas bordas das áreas removidas.

A prioridade é que o fundo fique convincente quando as camadas forem desligadas individualmente.

### 4. Exportar camadas

Cada camada deve:

- ter o mesmo tamanho da imagem original;
- preservar pixels originais quando possível;
- usar alpha/máscara limpa;
- ter nome claro;
- manter sombras junto do objeto quando isso facilitar a edição.

### 5. Montar PSD

Use ImageMagick quando disponível:

```bash
/opt/imagemagick/bin/magick \
  01_Fundo_limpo.png \
  02_Ornamentos.png \
  03_Textos_superiores.png \
  04_Foto_ou_moldura_superior.png \
  05_Foto_ou_moldura_inferior.png \
  06_Textos_principais.png \
  arte_em_camadas.psd
```

Também é aceitável gerar o PSD por Photoshop/Adobe quando o conector estiver disponível. Se uma seleção automática por prompt for bloqueada ou imprecisa, faça a segmentação manual/semiautomática com OpenCV/PIL.

### 6. Verificar antes de entregar

Crie uma prévia composta das camadas e compare com a imagem original.

Checklist mínimo:

- dimensões do PSD iguais às da imagem original;
- composição visual próxima do original;
- camadas alinhadas;
- textos não quebrados além do aceitável para raster;
- ornamentos sem excesso de textura do fundo;
- molduras/fotos com sombras preservadas;
- fundo limpo sem buracos óbvios;
- arquivo PSD abre como imagem Photoshop válida.

Use métrica de diferença visual como apoio, mas a inspeção visual manda.

### 7. Responder ao usuário

Explique de forma transparente:

- que o PSD está em camadas rasterizadas;
- quais grupos foram separados;
- que textos/vetores só são editáveis se recriados manualmente;
- entregue o link do PSD.

Modelo de resposta:

> Pronto — separei a arte em camadas rasterizadas e gerei o PSD. Incluí fundo limpo, textos, molduras/fotos, ornamentos e referência original. Como a imagem original estava achatada, os textos não ficam como texto editável; ficam como recortes rasterizados.

## Estratégias alternativas

- **PSD rasterizado rápido**: melhor para templates visuais e edição leve.
- **Recriação vetorial/manual**: melhor quando o usuário quer trocar texto, fonte, cor e formas com liberdade total.
- **Arquivo híbrido**: fundo e fotos rasterizados, textos recriados como texto editável quando fontes forem conhecidas.
- **Entrega em Canva/PPTX/AI além de PSD**: indicada quando o usuário quer editar sem Photoshop.

## Armadilhas comuns

- Não capturar textura do fundo junto com texto fino.
- Separar sombra em camada errada e deixar a moldura “flutuando”.
- Usar inpainting forte demais em áreas grandes e criar manchas.
- Prometer texto editável quando só existe recorte de pixels.
- Entregar PSD sem prévia composta ou sem verificar abertura.

## Gatilhos de uso

Ative esta skill quando o pedido tiver frases como:

- “separe em camadas”;
- “me entregue um PSD”;
- “transforme essa arte em template”;
- “preciso editar essa arte no Photoshop”;
- “isole fundo, textos, fotos e ornamentos”.
