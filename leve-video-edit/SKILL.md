---
name: leve-video-edit
description: Gera vídeos editados com Remotion a partir dos arquivos de qualquer pasta (gravações, fotos, logos, roteiros). Entrevista antes, organiza a pasta, aprova amostra e entrega o MP4 final.
---

# LeveVideoEdit

Transforma o conteúdo de uma pasta (gravação de fala, fotos, prints, logos, banners, roteiro, música) em um vídeo editado com Remotion, seguindo o ciclo **Preparar, Testar, Revisar, Reutilizar**. A IA executa a edição; as decisões sobre mensagem, oferta e aprovação são sempre do usuário.

Regras de ouro (valem para todas as fases):

1. **Nunca mexer nos originais.** Copiar, nunca mover, renomear ou apagar arquivos da pasta de origem.
2. **Amostra antes do vídeo inteiro.** 8 segundos para edição simples; 10 a 15 segundos quando houver moldura, motion, 3D ou recorte. Vídeo inteiro só depois da aprovação.
3. **Corrigir só o necessário.** Toda correção tem trecho, problema, mudança e o que preservar.
4. **Não inventar.** Preços, resultados, métricas, medidas, depoimentos, datas ou falas só entram se o usuário forneceu e confirmou.
5. **Não gastar sem autorização.** Usar ferramentas locais e os assets fornecidos. Nenhuma API paga, crédito, banco de imagens ou render em nuvem sem aprovação específica.
6. **Não fingir.** Não afirmar que usou uma skill, ferramenta ou arquivo que não abriu. Se algo faltar, dizer.
7. **Textos na tela sem emojis e sem travessão**, salvo pedido explícito.

---

## Fase 1. Inventário da pasta

Antes de perguntar qualquer coisa, olhar o que existe:

```bash
PASTA="<pasta indicada>"
find "$PASTA" -maxdepth 2 -type f | head -200
# duração, resolução, fps e áudio de cada mídia
for f in "$PASTA"/*.{mp4,mov,m4v,MOV,MP4,webm}; do [ -f "$f" ] && ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of compact "$f"; done
```

Classificar cada arquivo em: **gravação principal** (fala), **takes extras**, **imagens de apoio**, **logos/ícones**, **banners**, **roteiro/texto**, **referência de estilo**, **música/áudio**, **outros**. Detectar orientação (vertical/horizontal) e duração de cada vídeo. Se não houver gravação de fala, o vídeo é do tipo **montagem sem fala** (fotos, clipes e música; o ritmo vem da música ou da duração pedida, não da transcrição).

Apresentar o inventário em uma tabela curta ao usuário.

## Fase 2. Entrevista

Usar a ferramenta de perguntas de múltipla escolha (AskUserQuestion) em no máximo duas rodadas de até 4 perguntas, sugerindo opções com base no inventário. Não perguntar o que já está óbvio pelos arquivos.

**Rodada 1 (essencial)**

- **Tipo e destino:** anúncio, conteúdo, aula, convite, portfólio/montagem de fotos, depoimento. Canal: Reels/TikTok/Shorts (9:16, 1080 x 1920), feed (1:1 ou 4:5), YouTube/aula (16:9, 1920 x 1080).
- **Objetivo e público:** o que a pessoa deve entender ou fazer depois de assistir; quem vai assistir.
- **Nível de edição** (começar pelo menor que resolve):
  1. Simples: enquadramento, cortes de erros e pausas, áudio, legenda.
  2. Inserções: imagens, logos, ícones e banner sincronizados à fala.
  3. Motion explicativo: apresentador em moldura, cartões, ícones animados, lettering.
  4. Avançado: maquete 3D (@remotion/three) ou recorte de fundo com lettering em camadas.
- **CTA e oferta:** chamada real e dados confirmados, ou "sem CTA".

**Rodada 2 (estilo e limites)**

- **Estilo:** 2 ou 3 critérios observáveis (ex.: legenda de até duas linhas, duas cores, títulos curtos e condensados, animação discreta, rosto livre). Cores e fontes da marca, se houver. Referência opcional e **qual característica** aproveitar (tipografia, ritmo, enquadramento).
- **Inserções:** qual material entra em qual fala, ou "proponha uma sequência".
- **O que preservar:** voz original, improvisos, nomes e termos que exigem atenção na legenda.
- **Limites:** teto de gastos extras (padrão: zero), prazo, música (só se fornecida ou livre de direitos confirmada).

Se o usuário não estiver presente, escolher o padrão mais conservador (nível 1, 9:16, sem CTA inventado, sem gastos), declarar as suposições no topo da resposta e seguir.

## Fase 3. Estrutura de pastas

Criar um projeto novo e independente ao lado da pasta de origem (ou onde o usuário indicar). Nome curto e identificável, sem "final", "final2".

```text
<nome-do-video>/
  originais/     cópias preservadas das gravações (nunca editar)
  assets/        fotos, logos, ícones, banners, referências, música
  projeto/       projeto editável do Remotion (src = código, public = mídias usadas)
  entregas/      amostras e MP4s aprovados
  briefing.md    briefing preenchido
  padrao.md      regras visuais aprovadas (Fase 10)
  registro.csv   data, versão, tempo ativo, espera, extras, peças aprovadas
```

Copiar para `projeto/public/` só o que a composição usa, mantendo a origem intacta. Informar ao usuário onde ficou cada material.

## Fase 4. Ambiente e Remotion

1. Verificar `node --version`, `npm --version`, `git --version`, `ffmpeg -version`. Faltou algo: explicar o próximo passo em linguagem simples, usando a documentação oficial. Não atualizar o que já funciona sem explicar.
2. Criar o projeto em `projeto/` pela documentação atual do Remotion (ex.: `npx create-video@latest`, modelo em branco) e ajustar a composição para o formato escolhido.
3. Skills oficiais: se `remotion-best-practices` não estiver disponível, instalar com `npx skills add remotion-dev/skills` (documentação: remotion.dev/docs/ai/skills). Carregar e ler as referências pertinentes (animação, legendas, mídia, 3D, máscaras). Se não for possível, avisar e seguir a documentação oficial.
4. Conferir a compatibilidade de versões dos pacotes `@remotion/*` (todos na mesma versão).
5. Teste mínimo: composição de 5 segundos com um título, prévia no Studio aberta, sem exportar.

**Regras técnicas do Remotion**

- Toda animação depende do frame: `useCurrentFrame()`, `interpolate()`, `spring()`, `<Sequence>`. **Proibido** CSS animations/transitions, `setTimeout`, relógio próprio ou `useFrame` do R3F como relógio.
- Vídeo com `<OffthreadVideo>` (ou `<Video>`), mídias via `staticFile()` a partir de `public/`.
- 3D: `ThreeCanvas` de `@remotion/three`, geometria real, câmera animada pelo frame.
- Recorte de fundo: só com ferramenta realmente disponível (ex.: `@remotion/video-matting`, conferindo compatibilidade, WebGPU e licença do modelo). Alfa salvo como asset separado e reutilizado; MP4 H.264 não carrega transparência.

## Fase 5. Transcrição e briefing

1. **Transcrever a gravação real** com ferramenta local (ex.: `@remotion/install-whisper-cpp` ou whisper local). Roteiro fornecido serve só para conferir termos e sequência; a fala gravada é a fonte. Improvisos corretos permanecem.
2. Mapear erros, repetições (manter a melhor tomada), pausas longas, com tempos. Não cortar nada que mude o sentido.
3. Preencher `briefing.md`:

```markdown
# Briefing
Vídeo original: [arquivo]
Objetivo: [ação esperada]  |  Público: [quem assiste]
Formato e destino: [1080 x 1920 para Reels]
Estilo: [2 ou 3 critérios observáveis]  |  Fontes e cores: [identidade]
Legenda: até duas linhas, contraste, fora do rosto, acima da área da interface
Mensagem principal: [ideia]  |  CTA: [chamada real ou sem CTA]
Inserções: [fala ou tempo + material]
Preservar: voz, sentido da fala, [decisões aprovadas]
Não inventar: preços, resultados, provas, medidas
Primeira entrega: amostra de [8 | 10 a 15] s
```

4. **Proposta de sequência visual** curta: para cada bloco de ideia, o que aparece, como muda e qual ideia a mudança explica. Um foco por vez.
5. **Lacunas:** listar arquivos ausentes ou ambíguos e dados que faltam. Não começar contando com material que não existe; fornecer ou retirar a inserção. Aguardar confirmação do briefing.

## Fase 6. Amostra

Escolher um trecho **representativo** (fala, legenda, enquadramento e, se previsto, uma inserção ou a transição para moldura). Nunca validar o estilo só pela abertura vazia.

Renderizar a amostra como arquivo, não só no Studio:

```bash
cd projeto
npx remotion render <Composicao> ../entregas/amostra-v01.mp4 --frames=<ini>-<fim> --codec=h264 --audio-codec=aac
```

Para nível 4, fazer antes um **teste técnico de 5 segundos** (3D com volume, oclusão e sombra; ou recorte sobre fundo claro e escuro sem halos). Teste reprovado não avança.

Pedir ao usuário para assistir em tamanho de celular e conferir: rosto (cabelo, queixo, gestos), leitura da legenda, áudio, cortes, uso dos materiais. Aguardar aprovação.

**Critérios de layout**

- 9:16: legenda na faixa entre aproximadamente 60% e 78% da altura, nunca colada à borda inferior; topo livre para banner acima da cabeça; nada sobre o rosto.
- Moldura (motion explicativo): ponto de partida de cerca de 42% da largura e 34% da altura, canto oposto às explicações, cantos arredondados, borda fina, sombra suave, rosto centralizado acompanhando o movimento. Volta à tela cheia no CTA.
- 16:9 (aula): tela cheia como base; quadro explicativo à esquerda e apresentador em moldura à direita só quando a explicação precisa; cortes com respiros naturais, sem ritmo de anúncio.
- Motion: preparação, entrada, permanência com tempo de leitura, saída. Destacar só o item falado e reduzir a ênfase dos demais. No máximo dois títulos curtos por bloco. Legenda e título não repetem a mesma frase longa.
- Montagem sem fala: ritmo pela música ou pela duração; fotos com movimento suave (zoom/pan leve), sem distorcer proporção; textos só os fornecidos.

## Fase 7. Correções localizadas

Formato obrigatório de cada pedido de ajuste:

```text
[INÍCIO a FIM]: [problema] -> [mudança desejada]. Preservar: [o que já está aprovado].
```

Ordem de prioridade: mensagem e dados, depois áudio e legenda, depois enquadramento e acabamento. Renderizar só o trecho alterado com alguns segundos antes e depois. Se o **mesmo erro se repetir**, parar as tentativas, diagnosticar a causa, propor a menor correção e testar só o trecho afetado. Não refazer o vídeo inteiro nem abrir nova direção criativa.

## Fase 8. Vídeo completo

Com a amostra aprovada: aplicar o padrão ao restante, sincronizando tudo pela fala real (sem tempos presumidos). Salvar versões nomeadas (`<nome>-V01-base`, `<nome>-V02-insercoes`, ...) sem sobrescrever as anteriores. Abrir a prévia completa e aguardar revisão. **Ainda não exportar.**

## Fase 9. Exportação e conferência

Só após aprovação do vídeo completo:

```bash
cd projeto
npx remotion render <Composicao> ../entregas/<nome>-final.mp4 --codec=h264 --audio-codec=aac
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact ../entregas/<nome>-final.mp4
```

Conferir: arquivo abre fora da prévia, duração e fps iguais ao aprovado, áudio sincronizado, legendas corretas, rosto visível, assets sem cortes, CTA legível pelo tempo necessário. Entregar o MP4 ao usuário (e salvá-lo em `entregas/`). Não acrescentar efeitos nesta etapa.

## Fase 10. Padrão e registro

1. Escrever `padrao.md` com as regras aprovadas (fontes, cores, legenda, margens, enquadramento, moldura, transições, quando usar motion, exportação), **separadas** do conteúdo específico (textos, ofertas, preços, tempos). Incluir um checklist curto para o próximo vídeo.
2. Atualizar `registro.csv` só com dados observados: data, versão, tempo ativo, espera, extras pagos confirmados, peças aprovadas. Custo por peça = (assinaturas alocadas + uso adicional + API + extras) / peças aprovadas; sem peças aprovadas, não dividir. Nunca converter porcentagem de limite em preço por vídeo.

## Variações e lote

- **Variações A/B/C:** A é a base aprovada; B muda só o título; C muda só a fala de abertura (novo take). Oferta, corpo e CTA estáveis. Ficha com versão, arquivo, variável, destino e hipótese, sem métricas inventadas.
- **Próximo vídeo com o mesmo padrão:** copiar o projeto aprovado, refazer transcrição, adaptar títulos, inserções, oferta e CTA; nova amostra antes do vídeo inteiro. Não reaproveitar dados do vídeo anterior.
- **Lote:** até três vídeos, um de cada vez; o segundo só depois de conferir o primeiro.

## Resumo final ao usuário

Em poucas linhas: onde está o MP4 final, onde está o projeto editável, o que foi conferido e qualquer pendência ou material ausente.
