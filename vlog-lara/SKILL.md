---
name: vlog-lara
description: Montar e revisar vlogs da Lara com poucos cortes, inserts grandes em papel rasgado, diagnóstico de HDR, correção de cor sem alterar a montagem, trilhas com voz prioritária, capas e entrega no Drive. Use ao planejar, editar, corrigir, musicar ou entregar vídeos da Lara e ao manter o padrão das pastas Video N em A:/2026/Vídeos Lara.
---

# Vlog da Lara: estrutura, estilo e fluxo

Padrão consolidado dos vlogs finalizados em `A:/2026/Vídeos Lara`, incluindo a produção e as revisões de cor, trilhas, capas e entrega dos vídeos 4 a 10 até 15/10/2026. Idioma: português do Brasil. Pedidos e aprovações vigentes prevalecem sobre exemplos históricos.

Implementação de referência completa: `A:/2026/Vídeos Lara/viagem-misteriosa/` (ver `LEIA-ME.md` lá). Padrões de código: `references/remotion-padroes.md`.

## Regras de ouro

1. **Nunca mexer nos originais.** Copiar para `originais/` do projeto; normalizar em `projeto/public/clips/`.
2. **Respeitar as etapas aprovadas.** Em uma montagem nova, apresentar plano e prévia dos inserts antes do completo. Se o usuário já aprovou a prévia e autorizou os completos ou a aplicação do mesmo formato ao lote, continuar esse escopo sem pedir a mesma aprovação. Se pedir prévia de cor, aguardar essa aprovação antes de substituir o completo.
3. **Não inventar.** Lugares, nomes, preços e falas só se a Lara disse ou o usuário confirmou. Textos na tela sem emojis e sem travessão.
4. **Seguir a autorização atual.** Downloads de um lote já autorizado não precisam de novo ok por arquivo; registrar fonte, tamanho e licença. Não inferir autorização para compras ou nova publicação. Música do YouTube Music não implica licença nem autorização para extração de áudio.
5. **Transcrição real é a fonte dos tempos.** Nunca presumir onde a fala começa ou termina; medir no áudio.
6. **Identificar a gravação antes de editar cores.** Antes de qualquer conversão, LUT ou color grading, diagnosticar nos arquivos originais como cada vídeo foi gravado e selecionar a solução adequada ao modo de captura e à entrega. Seguir o diagnóstico obrigatório abaixo; não escolher ajustes de cor por aparência ou tentativa.

## Diagnóstico de cor obrigatório antes de editar

1. **Identificar a origem real, por clipe.** Antes de normalizar ou editar cores, examinar o original com `ffprobe -v error -show_streams -show_format -of json "ARQUIVO_ORIGINAL.mov"`. Registrar câmera/dispositivo e modo de captura quando disponíveis, codec/perfil, formato de pixels e profundidade de bits, `color_primaries`, `color_transfer`, `color_space`, `color_range` e metadados adicionais (Dolby Vision, mastering display e content light level). Distinguir SDR, HDR HLG, HDR PQ e Log. HEVC, 10 bits, extensão MOV ou a aparência da imagem, isoladamente, não identificam o modo de gravação. Tratar materiais mistos individualmente.
2. **Resolver a interpretação antes de ajustar.** Corroborar os metadados com quadros reais e, se houver campos ausentes ou inconsistentes, investigar a câmera, o modo de gravação e a procedência do arquivo. Não presumir um perfil nem iniciar o grading enquanto a interpretação de cor estiver indefinida. Registrar evidência, incertezas e espaço de cor da entrega.
3. **Escolher a solução para o formato identificado.** Consultar documentação técnica confiável e aplicar a transformação de entrada apropriada antes dos ajustes criativos. Para HDR para SDR, usar tone mapping e conversão de gamut compatíveis com a transferência e os metadados identificados; para Log, usar a transformação correspondente ao perfil confirmado. Conferir primárias, transferência, matriz e faixa na saída: apenas trocar tags não converte os pixels. Não reutilizar automaticamente uma LUT, curva ou ganho de exposição de outro vídeo.
4. **Trabalhar a partir dos originais.** Quando a conversão anterior tiver estourado altas luzes ou cores, refazer a conversão da origem em vez de tentar recuperar detalhe perdido no MP4 já convertido. Separar conversão técnica de color grading; proteger altas luzes, tons de pele e detalhes, com os ajustes leves solicitados. Correção somente de cor deve preservar montagem, cortes, inserts, quadros/tempos e áudio.
5. **Validar uma prévia antes do completo.** Conferir pele, objetos coloridos, brancos, sombras e detalhes claros em quadros da exportação e em uma prévia curta, no formato de entrega. Verificar metadados de saída e reprodução; registrar o diagnóstico, a transformação e o resultado. Quando o usuário solicitar aprovação de cor, aguardar sua aprovação da prévia antes de exportar outro completo. Validação técnica não equivale à aprovação visual do usuário.

## Formato

- **Pastas de projeto:** seguir `Video N + tema`, em sequência. Vídeo 5: `A:/2026/Vídeos Lara/Video 5 Hotel Adagio/` (pedido de 10/10/2026).

- 16:9, 1920x1080, 30 fps. Sem legenda (pedido fixo).
- Duração livre: a Lara prefere **o mínimo de cortes** e aceita vídeos longos; não impor teto de duração nem encurtar uma montagem aprovada.
- **Música quando autorizada:** entradas pontuais, fades e ducking, com voz e sons relevantes em primeiro plano. O formato musicado foi aprovado e estendido aos demais vídeos. Usar arquivos fornecidos ou fontes oficiais licenciadas no escopo autorizado; entregar créditos. Ver [trilhas-e-mixagem.md](references/trilhas-e-mixagem.md).

## Anatomia do vlog

1. **Abertura (selfie):** "Oi gente, tudo bem com vocês? Hoje eu estou aqui..." e o lugar. Às vezes gancho ("Qual lugar você acha que é? Coloca nos comentários").
2. **Apresentação:** quem vem junto (mãe, namorado, madrinha, prima) e uma pergunta curta ("quais as suas expectativas?").
3. **Corpo:** tomadas inteiras dela falando; planos sem fala (janela, comida, ambiente) entre elas.
4. **Encerramento (selfie):** "Espero que tenham gostado, deixa o like, se inscreve no canal, tchau tchau, beijão."

## Cortes e transições (aprovado no Vídeo 4)

- **Tomadas inteiras.** Não cortar pausas dentro da fala; só aparar trechos longos sem fala (janela de avião à noite etc.).
- **Fade (dissolvido de imagem e áudio) só quando muda o ambiente** (aeroporto para avião, voo para chegada, rua do hotel). 0,8 s entre blocos grandes, 0,5 s nos demais. Abertura com fade de entrada, final com fade de saída.
- **Demais pontos: corte seco** com micro-fade de áudio de 3 frames, para não estalar nem cortar palavra.
- Nunca colocar emenda no meio da fala. Antes de cortar, medir pausas, conferir a transcrição e ouvir a emenda. RMS em janelas de 0,1 s ajuda, mas ruído, respiração e fala baixa impedem usar um limiar universal.

## Inserts (estilo aprovado)

Gatilho: o insert entra quando ela fala do assunto (alinhar ao início real da frase, medido no áudio) e sai quando a frase termina. **Valorizar as imagens, antes pequenas:** usar composição grande e legível no celular; quando adequado, imagem em destaque e vídeo em janela lateral, mantendo a voz contínua. Nunca cobrir o rosto dela nem de quem fala junto; conferir em quadros reais. Exemplos de escala e capas em [capas-e-entrega.md](references/capas-e-entrega.md).

Estilo: **papel rasgado** (borda irregular, textura de papel, fita adesiva, sombra) com **fotos realistas** por dentro, mais animação de entrada com mola. Paleta: marinho `#0B1B3A`, dourado `#FFC83D`, vermelho `#E63946`, azul `#2B59C3`, branco. Fonte: Arial Black.

Repertório usado no Vídeo 4 (reaproveitar e adaptar ao tema):
- **Título** em papel rasgado com fita, letras subindo, avião na trilha tracejada.
- **Caixa de comentário do YouTube** digitando a pergunta ("Comenta aqui", "Já comentou?") quando ela pede palpites.
- **Carimbo** batendo sobre foto real (passaporte) com flash e tremida, para dicas.
- **Cartão de embarque** em papel com canhoto destacado ("DE BRASIL, PARA ?").
- **Mapa real** em papel rasgado com rota a caneta; em vídeo de mistério, a rota some no rasgo com "?".
- **Corte de apoio em moldura de janela de avião**, com a voz dela continuando por cima.
- **Revelação:** "?" pulsante, cortina tricolor, nome do lugar em letras que caem, foto real do ponto turístico em papel rasgado, confete nas cores do país.

Preferência vigente em 10/10/2026: o usuário pediu imagens geradas aqui no Codex para o Vídeo 4 e os próximos, mantendo o formato aprovado. Usar `image_gen` integrado, salvar os assets no projeto e registrar os prompts; bancos de imagens apenas se o usuário pedir. Imagens simbólicas não devem ser apresentadas como filmagens do estabelecimento real.

## Vídeo de mistério (destino secreto)

- A revelação é falada pela Lara; o insert só acompanha. Não revelar Paris antes dela, inclusive em capa, mapa, título ou imagem gerada quando o destino for o mistério do episódio.
- Antes dela, revisar quadro a quadro telas de voo, placas, logos e mapas. Mapas não mostram o continente de destino.

## Prévia dos inserts

- Composição `Previa` que junta janelas do vídeo completo (sem render do vídeo todo).
- **Janelas começam e terminam em cena inteira ou em pausa medida da fala** (a primeira prévia cortou palavras e o usuário reclamou).
- Renderizar em 1080p e reduzir com ffmpeg (`--scale` fracionário falha com dimensão não inteira).
- Para enviar ao celular, gerar cópia abaixo de 30 MB (960x540, crf 28).

## Fluxo de trabalho para um novo vídeo

1. **Inventário e diagnóstico de cor:** `ffprobe` dos originais de cada clipe (duração, resolução, fps, áudio, rotação e os metadados de cor do diagnóstico obrigatório). Identificar o modo de gravação e a transformação apropriada antes de normalizar ou aplicar color grading. A pasta pode vir em `.zip` e em subpasta com o nome do contato.
2. **Fala da Lara existe?** Transcrever (faster-whisper medium). Se não houver fala, parar e perguntar (o Vídeo 3, só com cenas de terceiros, foi cancelado).
3. **Ver o material:** grades de quadros por clipe (`fps=1/5,scale=200:-1,tile=10x3`).
4. **Roteiro** (`roteiro.md`): ordenar cenas pela cronologia real, fala e conteúdo; numeração IMG_xxxx é uma pista, não prova de ordem ou ausência de duplicatas. Registrar transcrição, trechos aparados, inserts e pendências. Não ignorar cenas novas: comparar inventário anterior/atual por identidade/conteúdo. Obter a aprovação que ainda faltar para o escopo.
5. **Preparar fontes** (`normalizar.sh` adaptado): conferir orientação e transformação de cor identificada; saída 1920x1080, 30 fps. Na montagem inicial, avaliar AAC 48 kHz e normalização da fala conforme a medição; a base antiga não é um preset de HDR. Em revisão somente de cor/trilha, preservar o áudio/montagem já aprovados conforme [cor-e-preservacao.md](references/cor-e-preservacao.md).
6. **Montar e entregar:** Remotion, quadros-chave para conferir inserts e prévia quando essa etapa ainda não estiver aprovada; render validado em `entregas/`. Aplicar trilha/capa conforme pedido, verificar no Drive e registrar resultados e limites. Não declarar fonte completa só porque exportou; faltas e arquivos incompletos continuam explícitos.

## Armadilhas técnicas

- **Rotação:** clipes com rotação -90 podem sair em pé com a imagem deitada. Testar um quadro com e sem `-noautorotate`; no Vídeo 4, um precisou de `-noautorotate` + `hflip,vflip` e outro só `-noautorotate`. Conferir cada um.
- **Whisper:** PyAV instalado não aceita `metadata_errors`; extrair áudio com ffmpeg (`-map 0:a:0 -ac 1 -ar 16000 -f f32le -`) e passar o array numpy. Gravar JSON com `encoding='utf-8'`. Whisper alucina em áudio sem fala.
- **Render longo:** usar log, marcador de término e concorrência compatível com memória disponível (`--concurrency=4` funcionou no projeto). Confirmar processo e erro antes de repetir; não iniciar renders duplicados. Marcador de início ou arquivo existente não provam conclusão.
- **Objetos JS com chaves "01", "10":** chaves numéricas são reordenadas; usar arrays para a ordem das cenas.
- Remotion 4.0.x: `OffthreadVideo` com `volume` em função de frame; animação só por `useCurrentFrame`/`interpolate`/`spring` (nada de CSS animation).

## Revisões e entrega

- **Só cor:** reconstruir das fontes interpretadas corretamente, preservando montagem, tempos, áudio e gráficos. Identificar a edição aprovada antes de substituir cenas; ver [cor-e-preservacao.md](references/cor-e-preservacao.md).
- **Só trilha:** partir do final de cor aprovado, copiar o vídeo sem recodificar, conferir sincronismo e créditos; ver [trilhas-e-mixagem.md](references/trilhas-e-mixagem.md).
- **Capas e pasta da cliente:** pares final/capa com nomes claros, apoio arquivado fora e substituição pelo mesmo ID quando solicitado. Verificar revisão atual, bytes, acesso e download no Drive; ver [capas-e-entrega.md](references/capas-e-entrega.md).
- **Conclusão:** distinguir validação técnica, entrega remota e revisão humana. Informar quantidade efetivamente entregue e pendências. Guardar recibos por etapa, sem alterar evidência histórica para fazê-la parecer atual.

## Continuidade do projeto

Estado, links e inventários mudam; consultar a ficha `A:/Obsidian/10 Projetos/Vídeos Lara.md` e recibos datados no projeto antes de retomar. Não transformar antigos “aguardar”, “em andamento” ou “já foi” em comandos atuais. A antiga espera do Louvre foi superada pela montagem autorizada e entregue; a orientação de música manual também foi superada pelo formato musicado aprovado.

O lote deixou duas fontes incompletas da Disney e uma do Mercure registradas: verificar se foram repostas antes de declarar recuperação ou completude. Não refazer Rio Quente ou outro episódio marcado pelo usuário como já concluído sem novo pedido. Ao concluir trabalho relevante, atualizar o Obsidian conforme o procedimento vigente, sem expor dados privados ou publicar históricos da cliente na skill pública.
