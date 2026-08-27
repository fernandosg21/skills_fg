---
name: gerar-proposta-comercial
description: Gera propostas comerciais no formato e identidade visual do Fernando Gonçalves, capa full-bleed, cabeçalho e rodapé com logo, tabela de módulos, seção de tempo economizado com destaque em caixa azul, tabela de investimento com modalidades, forma de pagamento e assinatura. Use sempre que o usuário pedir uma nova proposta comercial, orçamento formatado ou pacote de investimento para um cliente.
---

# Gerar proposta comercial

Formato padrão de proposta comercial em docx, construído e validado no projeto UPA Festas. Use este padrão sempre que pedirem uma nova proposta comercial para um cliente.

## Quando usar

Peça de gatilho: "monta uma proposta para [cliente]", "preciso de um orçamento formatado", "faz a proposta comercial de [projeto]". Sempre gere como arquivo `.docx` usando `docx` (npm), nunca como texto solto no chat.

Antes de escrever qualquer texto, confira o `CLAUDE.md` ou arquivo de contexto do projeto para os dados da empresa (razão social, CNPJ, endereço) e para a paleta e tipografia oficiais, se existirem.

## Identidade visual

| Papel | Valor |
|---|---|
| Azul dos títulos e da caixa de destaque | `#303E54` (NAVY) |
| Azul secundário, subtítulos e itálicos | `#5B6B82` (NAVY_SOFT) |
| Azul de fundo de tabela e de cabeçalho de tabela | `#1F3B57` (TABLE_BLUE) |
| Corpo de texto | `#3A3A3C` (BODY) |
| Texto secundário, rótulos | `#6E6E73` (MUTED) |
| Linha fina divisória | `#E5E5EA` (HAIRLINE) |
| Fundo de linha zebrada em tabela | `#F7F8FA` (CARD_FILL) |

Corpo de texto em Calibri. Títulos de seção e subtítulos em Cambria Bold, azul `#303E54`. Títulos de seção em versalete com tracking (`allCaps: true, characterSpacing: 14`). Texto do corpo sempre justificado (`AlignmentType.JUSTIFIED`), nunca alinhado à esquerda.

Escrita sem emojis e sem travessão, vírgula no lugar do travessão. Linguagem simples e direta, sem jargão técnico desnecessário, como se estivesse explicando para o dono do negócio, não para um programador. Nunca invente estatística ou percentual que o cliente não confirmou, quando não houver o dado real, diga isso abertamente e proponha uma faixa estimada, não um número fechado.

## Estrutura do documento

1. Capa full-bleed, página inteira com a imagem de capa do cliente ou da marca, sem margens.
2. Cabeçalho com o logo centralizado e linha fina abaixo, em todas as páginas de conteúdo.
3. Rodapé com ícone de marca, nome e paginação `X / Y`.
4. Bloco de título, elemento eyebrow "PROPOSTA COMERCIAL" em versalete, título grande em Cambria Bold, subtítulo em itálico.
5. Tabela sem bordas visíveis, estilo "ficha técnica", linhas rótulo/valor separadas por hairline (Cliente, Objeto, Formato, Escopo, Validade da proposta).
6. Seção 1, Introdução, contexto do problema do cliente em linguagem simples, seguido de bullets do que o projeto resolve.
7. Tabela resumo dos módulos ou etapas do projeto, cabeçalho azul `TABLE_BLUE`, linhas zebradas.
8. Uma seção numerada por módulo, explicando o que ele resolve, sempre em linguagem do dono do negócio, nunca em termo técnico cru.
9. Seção "Tempo Economizado e Retorno Esperado", com uma caixa de destaque no topo (fundo `TABLE_BLUE`, texto branco, allCaps, centralizado) trazendo o número mais forte do documento, por exemplo o total de horas devolvidas por mês. Depois, bullets por módulo com o tempo estimado e a tarefa manual que ele substitui. Por fim, "Retorno do investimento", separando economia fixa mensal de economia que escala por evento, sempre com a ressalva de que o número fica mais preciso quando o cliente confirmar o volume real.
10. Seção "Investimento", com tabela de modalidades de contratação (por exemplo licença de uso mensal versus venda definitiva da ferramenta), seguida de "Forma de pagamento" em bullets.
11. Assinatura de fechamento, nome em Cambria Bold com linha hairline acima, subtítulo em cinza abaixo. Sem seção de "próximos passos" quando o documento for para o cliente, esse tipo de observação fica só na versão interna de trabalho.

Sempre valide antes de entregar, renderize o docx em PDF com LibreOffice (`soffice --headless --convert-to pdf`) e leia as páginas como imagem para conferir quebras de página, tabelas cortadas e espaçamento, antes de apresentar o arquivo.

## Padrão de código, docx-js

Escreva o gerador como um script Node usando `docx`. Reaproveite estas funções auxiliares em todo novo documento, elas fixam o espaçamento e a tipografia sem precisar decidir de novo a cada proposta.

```js
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat,
} = require("docx");

const NAVY = "303E54", NAVY_SOFT = "5B6B82", TABLE_BLUE = "1F3B57";
const BODY = "3A3A3C", MUTED = "6E6E73", HAIRLINE = "E5E5EA", CARD_FILL = "F7F8FA";
const SPACE = { xs: 80, sm: 140, md: 220, lg: 360, xl: 520, xxl: 640 };
const LINE = 312;

function bulletPara(boldLead, rest) {
  const runs = [];
  if (boldLead) runs.push(new TextRun({ text: boldLead, bold: true, font: "Calibri", size: 22, color: BODY }));
  runs.push(new TextRun({ text: rest, font: "Calibri", size: 22, color: BODY }));
  return new Paragraph({
    numbering: { reference: "bullet-list", level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: SPACE.md, line: LINE, lineRule: "auto" },
    children: runs,
  });
}

function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: SPACE.lg, line: LINE, lineRule: "auto" },
    children: Array.isArray(text) ? text : [new TextRun({ text, font: "Calibri", size: 22, color: BODY })],
  });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: SPACE.xxl, after: SPACE.lg },
    keepNext: true,
    children: [new TextRun({ text, font: "Cambria", bold: true, size: 25, color: NAVY, allCaps: true, characterSpacing: 14 })],
  });
}

function subHeading(text) {
  return new Paragraph({
    spacing: { before: SPACE.xl, after: SPACE.sm },
    keepNext: true,
    children: [new TextRun({ text, font: "Cambria", bold: true, size: 21, color: NAVY })],
  });
}

// caixa de destaque, use na seção de tempo economizado / ROI para o número mais forte
function statBox(headline, subtext) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: TABLE_BLUE },
      margins: { top: 260, bottom: 260, left: 280, right: 280 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: SPACE.xs },
          children: [new TextRun({ text: headline, bold: true, font: "Calibri", size: 22, color: "FFFFFF", allCaps: true, characterSpacing: 12 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: subtext, font: "Cambria", italics: true, size: 20, color: "D8DEE8" })] }),
      ],
    })] })],
    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
  });
}

// tabela com cabeçalho azul e linhas zebradas, use para módulos e para investimento
function makeTable(headers, colWidths, rows) {
  function headerCell(text, width) {
    return new TableCell({ width: { size: width, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: TABLE_BLUE }, verticalAlign: VerticalAlign.CENTER, margins: { top: 170, bottom: 170, left: 180, right: 180 }, children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Calibri", size: 17, color: "FFFFFF", allCaps: true, characterSpacing: 10 })] })] });
  }
  function bodyCell(text, width, fill, isLastRow) {
    return new TableCell({ width: { size: width, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill }, verticalAlign: VerticalAlign.CENTER, borders: isLastRow ? {} : { bottom: { style: BorderStyle.SINGLE, size: 3, color: HAIRLINE } }, margins: { top: 150, bottom: 150, left: 180, right: 180 }, children: [new Paragraph({ spacing: { line: 264, lineRule: "auto" }, children: [new TextRun({ text, font: "Calibri", size: 20, color: BODY })] })] });
  }
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
      ...rows.map((r, i) => { const isLastRow = i === rows.length - 1; const fill = i % 2 === 0 ? "FFFFFF" : CARD_FILL; return new TableRow({ children: r.map((c, j) => bodyCell(c, colWidths[j], fill, isLastRow)) }); }),
    ],
    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
  });
}
```

Página US Letter (`width: 12240, height: 15840` em DXA), capa sem margens (`margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 }`), conteúdo com margem `{ top: 1500, bottom: 1400, left: 1440, right: 1440, header: 620, footer: 620 }`. Toda tabela de conteúdo usa largura total `9360` DXA (largura útil da página com essas margens), e as colunas de cada tabela precisam somar exatamente esse valor.

Lista com marcador, sempre via `numbering` config com `LevelFormat.BULLET`, nunca `•` digitado direto no texto:

```js
numbering: { config: [{ reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 260 }, spacing: { after: SPACE.md } }, run: { color: NAVY_SOFT } } }] }] }
```

## Checklist antes de entregar

Confirme, nesta ordem: dados da empresa corretos, nenhuma estatística inventada, texto sem travessão e sem emoji, corpo de texto justificado, seção de tempo economizado com a caixa de destaque no topo, tabela de investimento com todas as modalidades combinadas com o cliente da proposta, sem seção de "próximos passos" se o arquivo for para o cliente final, PDF renderizado e conferido visualmente, arquivo salvo na pasta correta do projeto.

## Origem

Formato consolidado a partir da proposta comercial do projeto UPA Festas (agosto de 2026), depois de passes de humanização de texto, justificação, remoção de travessão e adição da seção de tempo economizado e retorno com caixa de destaque.
