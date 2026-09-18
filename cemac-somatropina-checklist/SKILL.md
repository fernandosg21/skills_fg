---
name: cemac-somatropina-checklist
description: Organiza e audita a pasta de documentos de um paciente para abertura ou renovação de processo de Somatropina (deficiência do hormônio do crescimento / hipopituitarismo, CID E23.0) no CEMAC Juarez Barbosa (Goiás). Use sempre que o usuário pedir para conferir, organizar ou montar o checklist da documentação de um paciente para esse processo — mesmo que ele não diga "CEMAC" explicitamente, como em "confere a documentação da fulana", "organiza os documentos desse paciente para o hormônio do crescimento", "vê se falta algum exame", "monta a lista pra mandar pra mãe conferir", "os documentos chegaram, dá uma olhada se tá tudo certo" ou "vê se tem algo perto de vencer". Cobre também renovação de processo já aberto e conferências rápidas focadas só em prazos de validade.
---

# Checklist CEMAC — Somatropina (Deficiência do Hormônio do Crescimento)

Este fluxo audita a papelada de um paciente contra a lista oficial de documentos do
CEMAC Juarez Barbosa para o CID E23.0 (Somatropina), organiza a pasta em duas
categorias, e produz dois entregáveis: um checklist detalhado em markdown e uma
imagem compacta para mandar pra família conferir no WhatsApp.

Guia oficial (reconfira se parecer desatualizado — protocolos de saúde mudam):
`https://goias.gov.br/saude/wp-content/uploads/sites/34/files/cemac/documentos-e-orientacoes/DEFICIENCIADOHORMONIODECRESCIMENTO-Hipopituitarismo.pdf`
Instruções gerais de abertura de processo:
`https://goias.gov.br/saude/wp-content/uploads/sites/34/files/cemac/informacoes/orientacoes-gerais.pdf`

## Antes de começar

1. Descubra a pasta do paciente. Se o usuário mencionou uma pasta ou nome, use-a; se
   houver mais de uma pasta plausível (ex: uma pasta "de referência" de outro paciente
   já organizado e uma pasta nova), pergunte qual é a do paciente atual antes de mexer
   em qualquer arquivo.
2. Pegue a data de hoje do ambiente (contexto `currentDate`), nunca da data de
   modificação dos arquivos — timestamps de arquivo não têm relação com a data real
   nem com a data dos exames. Todo cálculo de vencimento usa a data real de hoje.
3. Leia **todos** os arquivos da pasta antes de organizar ou concluir qualquer coisa.
   É comum o mesmo documento aparecer duplicado (foto + PDF escaneado do mesmo papel,
   ou uma remessa nova reenviando tudo de novo junto com 2-3 arquivos realmente novos).
   Compare por conteúdo, não só pelo nome do arquivo.

## Como ler os arquivos sem perder informação

- PDFs de laudo de laboratório com várias páginas (painéis com TSH, T4, glicemia,
  IGF-1 etc. todos no mesmo arquivo) às vezes não aparecem visualmente na primeira
  chamada da ferramenta de leitura — ela só confirma "PDF file read" sem mostrar o
  conteúdo. Se isso acontecer, tente ler o arquivo de novo sozinho (não em lote com
  outros); se ainda faltar conteúdo, rode `pdfplumber` via bash para extrair o texto
  (mais confiável para PDFs de texto/tabela). Reserve a leitura visual para
  formulários manuscritos, carimbos e imagens de exame.
- Nomes de arquivo com acento (ex: "Ressonância", "Relatório") podem falhar ao tentar
  copiar com `cp` direto no bash mesmo quando o arquivo existe — é um problema de
  normalização Unicode. Se `cp "Ressonância X.pdf" destino` disser "No such file or
  directory", resolva com Python: `os.listdir(pasta)` e pegue o arquivo cujo nome
  comece com o prefixo que você reconhece, em vez de digitar o nome acentuado à mão.
- **Sempre leia o corpo do laudo, não só o nome do arquivo ou o cabeçalho da
  requisição.** Já aconteceu de um arquivo chamado "Ressonância Sela Turcica.pdf",
  com cabeçalho pedindo "RM SELA TURCICA/HIPOFISE", ter no corpo do laudo uma
  ressonância de **coluna torácica** — claramente um laudo trocado pela clínica. Isso
  só se descobre lendo a seção ACHADOS/CONCLUSÃO de cada laudo de imagem, não o
  cabeçalho.
- **Isso vale igualmente para os documentos pessoais, inclusive os que você mesmo
  renomeou.** Já aconteceu de um arquivo batizado de "Passaporte - pág 2.pdf" ser, no
  conteúdo, a **Certidão de Nascimento** (frente e verso), duplicando um JPEG que já
  estava na pasta como certidão, enquanto o "pág 1" era o passaporte inteiro. Nomes de
  origem crus ("REPÚBLICA FEDER ATIVA DO BRASIL.pdf", "tenor de 12 anos de Idade.pdf",
  "IMG_0471.jpeg") não dizem nada sobre o conteúdo. Antes de renomear qualquer
  documento pessoal, abra e confirme o que é.
- **Procure duplicatas entre formatos diferentes.** O mesmo documento costuma chegar
  como foto (JPEG) e como PDF escaneado, com nomes que não se parecem. Quando achar
  duas versões, fique com a mais completa (frente e verso, melhor legibilidade) e
  descarte a outra, em vez de mandar as duas para o CEMAC.

## O que exigir (CID E23.0 — crianças e adolescentes, 0-18 anos)

### Documentos pessoais
- Documento de identificação com foto (RG, CNH ou passaporte) ou Certidão de
  Nascimento.
- CPF (o número pode constar em outro documento — certidão, CNS — não precisa
  necessariamente do cartão físico).
- Cartão Nacional de Saúde (CNS).
- Comprovante de endereço com CEP (água, luz ou telefone), **validade 3 meses**.

### Documentos emitidos pelo médico
- **LME** (Laudo de Solicitação, Avaliação e Autorização de Medicamentos) — validade
  **90 dias** a partir do preenchimento.
- **Receituário de Controle Especial** (Somatropina) — validade **30 dias corridos**
  a partir da emissão. Precisa de receita válida a cada dispensação, não só na
  abertura.
- **Termo de Esclarecimento e Responsabilidade**, assinado pelo paciente/responsável
  legal e pelo médico, sem emenda/rasura.
- **Relatório médico**, exclusivamente de endocrinologista e/ou pediatra, precisa
  informar (confira item a item, não trate como "completo/incompleto" genérico):
  - idade, altura e peso atuais;
  - estadiamento puberal (Tanner);
  - altura medida dos pais biológicos (ou justificativa formal se não for possível,
    ex: adoção);
  - peso e comprimento ao nascer + idade gestacional (ou justificativa formal);
  - reposições hormonais realizadas;
  - se há outras doenças concomitantes;
  - se houve uso prévio de hormônios sexuais (priming) antes do teste provocativo —
    **obrigatório informar quando o Tanner é abaixo do estágio 3**.
- **Curva de crescimento**, segundo o padrão **OMS 2007** — se o gráfico usado for de
  outra referência (CDC é o erro mais comum), sinalize como ponto de atenção mesmo que
  o documento exista.

### Exames
- Raio-X de mãos e punhos (idade óssea) — **validade 1 ano**.
- Dosagem de IGF-1 (Somatomedina-C) — sem prazo formal definido para abertura de
  processo (só para renovação, 30 dias), mas sinalize se a coleta for antiga
  (>3 meses) e sugira repetir junto com outros exames que já precisam ser refeitos.
- TC ou RM da região hipotálamo-hipofisária (sela túrcica) — sem prazo formal, mas
  confirme sempre que o corpo do laudo é da região certa (ver seção anterior).
- GH Basal + **2 testes de estímulo** (Clonidina, Insulina, GHRH-arginina ou
  Glucagon) com **datas e estímulos diferentes**. Em casos com alteração anatômica
  documentada em relatório, aceita-se 1 teste só.
- TSH — sem prazo formal específico no protocolo, mas mesma lógica do IGF-1: se
  antigo, sugerir repetir junto.
- T4 livre ou total — **validade 90 dias**.
- Glicemia de jejum — **validade 90 dias**.

### Renovação (se for o caso, não abertura)
A cada 6 meses: LME + receita novos. RX de mãos e punhos anualmente (validade 90 dias
no ato da renovação). IGF-1 com validade 30 dias. Curva de crescimento ou relatório
com velocidade de crescimento do último ano, validade 30 dias.

## Linha do tempo de vencimentos — sempre monte essa tabela

Além de marcar cada item como ok/pendente, construa uma tabela única com **todo item
que tem prazo de validade** (mesmo os que ainda estão dentro do prazo), ordenada da
data de vencimento mais próxima para a mais distante. Isso é o que o usuário mais
usa para decidir o que resolver primeiro — não deixe implícito, mostre a data do
exame/emissão, a data de vencimento calculada e quantos dias faltam (ou há quanto
tempo venceu). Calcule a diferença de dias de verdade (dia a dia, considerando o
tamanho de cada mês) em vez de arredondar para "cerca de X semanas/meses" — o valor
de mostrar essa tabela é a precisão:

| Documento | Data do exame/emissão | Vence em | Status |
|---|---|---|---|
| Glicemia de jejum | 23/05/2026 | 21/08/2026 | Vencido há 11 dias |
| T4 livre | 23/05/2026 | 21/08/2026 | Vencido há 11 dias |
| Receita de Somatropina | 16/08/2026 | 15/09/2026 | Vence em 14 dias |
| Comprovante de endereço | 29/07/2026 | 29/10/2026 | Vence em 59 dias |
| Passaporte | — | 03/11/2026 | Vence em 63 dias |
| LME | 12/08/2026 | 10/11/2026 | Vence em 70 dias |

Regra de destaque: qualquer item que vence em **30 dias ou menos** (mas ainda não
venceu) entra como "atenção — vence em breve", separado dos já vencidos e dos
tranquilos. Isso vale tanto no relatório em markdown quanto, resumidamente, na
imagem para WhatsApp — não é só para itens já vencidos.

Logo abaixo da tabela, liste separadamente os exames que **não têm prazo formal**
no protocolo (hoje isso é só IGF-1 e TSH) mas cuja coleta já é antiga — não misture
com a tabela de vencimento oficial, já que não venceram de fato, mas avise que vale
repetir junto com o que já precisa ser refeito por praticidade de coleta, não por
exigência do CEMAC.

Se o pedido do usuário for especificamente sobre prazos/vencimentos (ex: "confere se
tem algo perto de vencer", "atualiza as datas") e não uma auditoria completa da
pasta, não é preciso refazer o checklist inteiro nem a imagem — recalcule e mostre
só essa tabela, atualizando a seção correspondente no checklist em markdown já
salvo, se ele existir.

## Organizando a pasta

Replique a estrutura de duas pastas na raiz da pasta do paciente:

- **Documentos Pessoais/**: identidade, CPF, CNS, comprovante de endereço.
- **Documentos Médicos/**: LME, laudo/relatório médico, curva de crescimento,
  receita, termo de esclarecimento, e todos os exames (GH, RX, RM/TC, IGF-1,
  TSH/T4/glicemia).

Regras importantes de arquivo:
- **Copie, não presuma que dá pra mover.** Arquivos já salvos na pasta do
  usuário (fora da área de rascunho) ficam protegidos contra exclusão por padrão —
  um `rm`/`mv` que remova o original vai falhar silenciosamente com "Operation not
  permitted", mesmo em arquivo que você acabou de criar. Copie os documentos para os
  nomes/pastas organizados; só tente apagar os arquivos antigos redundantes (as
  cópias soltas de antes, um laudo comprovadamente trocado por um correto, uma
  receita ou exame já substituído por versão mais nova) depois de organizar, usando
  a ferramenta de permissão de exclusão. Se o usuário recusar a exclusão, não
  insista — só avise que os arquivos antigos continuam lá como duplicata.
- Quando um laudo, receita ou exame enviado antes for substituído por uma versão
  mais nova ou corrigida (ex: o caso da ressonância trocada, ou uma receita/exame
  vencido refeito), troque o arquivo antigo pelo novo nesta pasta organizada, não
  deixe os dois.
- Um PDF de laboratório com múltiplos exames em um único arquivo (comum em painéis
  gerais) pode ser dividido com `pypdf` nas páginas relevantes para nomear cada laudo
  separadamente (ex: "Laudos Glicemia, TSH e T4 - DATA.pdf", "Laudo IGF-1 -
  DATA.pdf"), ou mantido como um único arquivo com nome que liste todos os exames
  que contém, se isso já ficar claro e organizado o suficiente — evite deixar um
  arquivo monolítico com nome genérico tipo "Exame [mês] [ano].pdf".

### Tamanho dos arquivos

Fotos e digitalizações de documento costumam chegar com 5 a 15 MB por arquivo, o que
trava o upload no portal. Comprima tudo que passar de ~4 MB com Ghostscript antes de
montar o pacote de entrega:

```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH -sOutputFile=saida.pdf entrada.pdf
```

`/ebook` (150 dpi) costuma reduzir de 12 MB para menos de 1 MB. **Sempre confira a
legibilidade depois**: renderize pelo menos uma página do arquivo comprimido
(`pdftoppm -jpeg -r 80 saida.pdf pag`) e olhe a imagem, com atenção especial aos
formulários preenchidos à mão (LME, termo) e à letra pequena de certidões. Se ficar
ilegível, refaça com `/printer` (300 dpi).

## Entregável 1 — Checklist em markdown

Salve na raiz da pasta do paciente como
`Checklist - Abertura de Processo CEMAC (Somatropina).md` (ou "Renovação..." se for
o caso). Estrutura, sempre nessa ordem:

1. Cabeçalho com data de referência da revisão e origem dos arquivos conferidos.
2. Um parágrafo curto de resumo geral (o que mudou desde a última conferência, se
   houver uma anterior, e o estado geral).
3. Documentos pessoais.
4. Documentos médicos (formulários).
5. Exames — separe em "completos e válidos", "vencidos" e "com dúvida/divergência".
6. Dúvidas para confirmar com o médico (peça por peça — cada campo faltante do
   relatório, cada divergência de leitura, cada padrão de curva errado; nunca
   resuma como "relatório incompleto" sem listar o que falta).
7. **Linha do tempo de vencimentos** (a tabela descrita acima, sempre presente,
   mesmo quando nada estiver vencido — nesse caso mostre os prazos futuros mais
   próximos).
8. Tabela-resumo final de uma linha por item.

## Entregável 2 — Imagem para WhatsApp

Gere um PNG compacto e informal, endereçado à pessoa responsável pelo paciente
(pergunte o nome se não estiver claro pela conversa), listando **todo item que
precisa de ação** — não só os com prazo vencido/perto de vencer, mas também
problemas sem data: laudo com conteúdo trocado, exame que ainda falta chegar,
campo faltando no relatório, curva no padrão errado, divergência de leitura para
confirmar com o médico. Um item com data leva a data do exame + data de vencimento
na nota; um item sem data leva só o motivo em uma linha curta. Não filtre a imagem
só pelos itens datados — essa é a lista completa de pendências, só que resumida em
uma linha cada, não o relatório inteiro. Se não houver mais nenhum item vencido ou
faltando (só pendências de conteúdo/confirmação), ajuste o título e o cabeçalho da
imagem para refletir isso (ex: "O que falta confirmar" em vez de "O que falta
ajustar") em vez de forçar a linguagem de urgência quando o quadro melhorou. Feche
com uma linha em destaque sobre o prazo mais urgente (se algo já venceu, destaque o
vencido mais crítico — normalmente o que trava mais a abertura do processo, como um
exame corrigível rápido versus um que demanda reagendar exame; se nada venceu ainda,
destaque o próximo prazo que se aproxima) e uma linha final dizendo que o resto já
está certo. Sem emoji (as fontes do sandbox não renderizam a maioria deles — viram
um quadrado vazio) e sem travessão, seguindo a preferência de escrita do usuário.

Renderize com Pillow (`PIL`), fonte DejaVu Sans (`/usr/share/fonts/truetype/dejavu/`,
já presente no sandbox — suporta acentuação em português). Sempre calcule a altura
do canvas em duas passadas (primeiro meça a altura de cada bloco de texto, defina o
`Image.new` com o total certo, depois desenhe) — desenhar direto numa altura fixa
estimada corta conteúdo quando a lista é maior do que o previsto. Script de
referência (adapte a lista de itens, o título/cabeçalho e o rodapé a cada execução):

```python
# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont

W = 1080
BG = (247, 245, 240); CARD = (255, 255, 255); BORDER = (228, 225, 216)
TEXT = (31, 29, 24); DIM = (110, 104, 90); ACCENT = (47, 107, 79)
WARN_BG = (253, 243, 226); WARN_BORDER = (240, 212, 154); WARN_TEXT = (138, 90, 18)
MISS_BG = (251, 234, 234); MISS_BORDER = (234, 184, 184); MISS_TEXT = (163, 49, 47)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def f(p, s): return ImageFont.truetype(p, s)
title_f, sub_f, item_f, note_f, foot_f, foot_b = (
    f(FB, 46), f(FR, 28), f(FB, 32), f(FR, 26), f(FR, 26), f(FB, 26))

dummy = Image.new("RGB", (10, 10)); dd = ImageDraw.Draw(dummy)

def wrap(text, font, max_w):
    words, lines, cur = text.split(" "), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if dd.textlength(t, font=font) <= max_w: cur = t
        else:
            if cur: lines.append(cur)
            cur = w_
    if cur: lines.append(cur)
    return lines

def rr(d, box, r, **kw): d.rounded_rectangle(box, radius=r, **kw)

margin = 56
# items: list of (status "warn"/"miss", title, note-with-dates)
# STATUS_MAP defines colors/symbol per status
STATUS_MAP = {
    "warn": (WARN_BG, WARN_BORDER, WARN_TEXT, "!"),
    "miss": (MISS_BG, MISS_BORDER, MISS_TEXT, "X"),
}

def render(title_text, sub_text, header_label, items, foot_lines_bold, foot_lines_dim, out_path):
    sub_lines = wrap(sub_text, sub_f, W - 2 * margin)
    pad = 26
    inner_w = W - 2 * margin - 2 * pad - 56
    positions = []
    body = pad
    for status, name, note in items:
        tl = wrap(name, item_f, inner_w)
        nl = wrap(note, note_f, inner_w) if note else []
        h = 6 + 40 * len(tl) + 32 * len(nl) + 22
        positions.append((status, tl, nl, h))
        body += h
    body += pad - 6

    y = 60 + 58 + 36 * len(sub_lines) + 34 + 48 + body + 40
    y += 30 * len(foot_lines_bold) + 6 + 30 * len(foot_lines_dim) + 50
    img = Image.new("RGB", (W, int(y)), BG)
    d = ImageDraw.Draw(img)

    y = 60
    d.text((margin, y), title_text, font=title_f, fill=TEXT); y += 58
    for line in sub_lines:
        d.text((margin, y), line, font=sub_f, fill=DIM); y += 36
    y += 34
    d.text((margin, y), header_label, font=f(FB, 30), fill=WARN_TEXT)
    y += 48

    top = y
    rr(d, (margin, top, W - margin, top + body), 22, fill=CARD, outline=BORDER, width=2)
    yy = top + pad
    for status, tl, nl, h in positions:
        bg, bord, col, sym = STATUS_MAP[status]
        cx, cy = margin + pad + 22, yy + 20
        rr(d, (cx - 22, cy - 22, cx + 22, cy + 22), 999, fill=bg, outline=bord, width=2)
        bb = d.textbbox((0, 0), sym, font=f(FB, 24))
        d.text((cx - (bb[2]-bb[0])/2, cy - (bb[3]-bb[1])/2 - bb[1]), sym, font=f(FB, 24), fill=col)
        tx, ty = margin + pad + 56, yy
        for line in tl: d.text((tx, ty), line, font=item_f, fill=TEXT); ty += 40
        for line in nl: d.text((tx, ty + 2), line, font=note_f, fill=DIM); ty += 32
        yy += h
    y = top + body + 40
    for line in foot_lines_bold: d.text((margin, y), line, font=foot_b, fill=ACCENT); y += 30
    y += 6
    for line in foot_lines_dim: d.text((margin, y), line, font=foot_f, fill=DIM); y += 30

    img.save(out_path)
```

Chame `render(...)` com os itens pendentes reais (status `"miss"` para vencido/
faltando, `"warn"` para "vence em breve" ou divergência a confirmar), o cabeçalho
("AINDA PRECISA AJUSTAR" quando há vencidos/faltantes, "AINDA PRECISA CONFIRMAR"
quando restam só pendências de conteúdo), o rodapé em negrito com o prazo mais
urgente de todos, e uma linha final dizendo que o resto está certo. Salve o PNG na
pasta do paciente com nome claro (ex: "Checklist para WhatsApp - [nome do
responsável].png"), substituindo a versão anterior.

## Entregável 3 — Pacote para entrega (só quando o processo estiver pronto para envio)

Quando o usuário pedir para montar o pacote que vai para a família dar entrada, crie
na raiz da pasta do paciente uma pasta `Pacote para Entrega - CEMAC [nome]` com
**cópias numeradas na ordem de envio**, já comprimidas:

```
01 - Certidao de Nascimento.pdf     06 - Receita Somatropina.pdf
02 - Passaporte.jpeg                07 - Termo de Esclarecimento.pdf
03 - Cartao CNS.pdf                 08 - Relatorio Medico.pdf
04 - Comprovante de Endereco.pdf    09 - Curva de Crescimento.pdf
05 - LME.pdf                        10..N - exames (GH, RX, RM, laboratório)
```

Regras: documentos pessoais primeiro, depois formulários médicos, depois exames.
Nomes sem acento e sem caractere especial (o portal às vezes recusa). Um documento
por arquivo, nenhuma duplicata. As pastas `Documentos Pessoais` e `Documentos
Médicos` continuam existindo como arquivo organizado do usuário; o pacote é a versão
pronta para upload.

## Entregável 4 — Passo a passo para a família (Word)

Documento `.docx` (a família costuma abrir no celular; markdown não serve) na raiz da
pasta do paciente, endereçado ao responsável, curto e sem jargão. Conteúdo:

1. Próxima ação, em uma linha, no topo.
2. Onde estão os documentos (nome da pasta e quantos arquivos, na ordem numerada).
3. Passo a passo do envio: conta gov.br (login é o CPF, nível Bronze basta) →
   página do CEMAC Juarez Barbosa (`goias.gov.br/saude/cemac-juarez-barbosa`) →
   botão "Solicitar Abertura de Processo" → login gov.br → anexar os arquivos um a
   um na ordem numerada.
4. Prazos: até 10 dias úteis para conferência dos documentos + 5 dias úteis para
   autorização (até 15 dias úteis no total até o medicamento ficar disponível).
5. O que ainda precisa ser confirmado com o médico, se houver pendência.
6. Onde tirar dúvida: WhatsApp do CEMAC (62) 99945-1593 — **só mensagem de texto**,
   não recebe ligação nem áudio. Endereço: Rua 16 esq. c/ Rua 12, nº 97, Centro,
   Goiânia-GO, 74015-020. Telefones (62) 3201-7446 / 3201-7453 / 3201-7450.

Lembre também que o processo é todo eletrônico, que os originais em papel ficam com
a família e podem ser exigidos a qualquer momento, e que o portal aceita PDF, JPG e
PNG.

## Ao terminar

Apresente os arquivos gerados ao usuário (checklist em markdown + imagem, e o
passo a passo se tiver sido pedido) e resuma em 1-2 frases o que mudou desde a última
conferência, sem repetir o checklist inteiro no chat — o arquivo já mostra os
detalhes. Se o número de arquivos do pacote mudar, atualize também o passo a passo,
que cita essa quantidade.
