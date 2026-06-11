---
name: contratos-assinatura-digital-br
description: Implementa sistema completo de contratos com assinatura digital/eletrônica seguindo a legislação brasileira (MP 2.200-2/2001 art. 10 §2º, Lei 14.063/2020), com geração a partir de templates DOCX, link público de assinatura por token, coleta de evidências (IP, user-agent, CPF, canvas), hashes SHA-256 de inviolabilidade e verificação de integridade. Use quando o usuário pedir para implementar contratos, assinatura digital, assinatura eletrônica, e-signature, validade jurídica de documentos, geração de contrato a partir de modelo/template, ou inviolabilidade de documentos assinados. Baseada na implementação de referência do Memora (a:\Site Fotografia\Memora.fot.br).
---

# Contratos + Assinatura Digital (legislação brasileira)

Skill de implementação: replica em qualquer projeto o sistema de contratos do Memora —
geração a partir de templates DOCX com placeholders, envio de link público de assinatura,
assinatura eletrônica com evidências forenses e inviolabilidade por hash. As citações
`arquivo:linha` nos references apontam para a implementação de referência em
`a:\Site Fotografia\Memora.fot.br` (consulte-a quando disponível; se não, os references
contêm o essencial).

## Arquitetura em uma frase

O contrato **nasce DOCX** (template Word com tags `[TAG]`/`{TAG}`/`{{TAG}}`), é renderizado
por um templator que edita o XML do ZIP, vira PDF por conversor externo (Stirling PDF ou
LibreOffice headless), e é assinado numa página pública acessada por **token de 256 bits**
(só o SHA-256 do token vai ao banco); o ato de assinar coleta evidências (IP, user-agent,
timestamp, CPF confirmado, PNG do traçado) e congela o documento assinado com **hashes
SHA-256 verificados a cada download**.

## Referências (leia conforme a etapa)

| Arquivo | Conteúdo |
|---|---|
| [references/geracao-de-contratos.md](references/geracao-de-contratos.md) | Pipeline de geração: catálogo de templates, modelos por tenant, sistema de placeholders (~140 tags), resolver de modelo, DocxTemplator |
| [references/assinatura-e-seguranca.md](references/assinatura-e-seguranca.md) | Token, página de assinatura, endpoint, evidências, hashes, verificação de integridade, falhas conhecidas |
| [references/schema-e-fluxo.md](references/schema-e-fluxo.md) | DDL das tabelas, ciclo de vida do contrato, armazenamento de artefatos |
| [references/conformidade-legal.md](references/conformidade-legal.md) | Fundamentação legal (MP 2.200-2, Lei 14.063, CDC, CC, Lei 9.610), estrutura de cláusulas, melhorias obrigatórias sobre a referência |

## Ordem de implementação

Implemente nesta ordem — cada etapa funciona sem as seguintes:

1. **Schema** — tabelas de domínio (cliente, evento/pedido, pacote/serviço) + as tabelas de
   contrato/assinatura do [schema-e-fluxo.md](references/schema-e-fluxo.md). Use migração
   idempotente (`CREATE TABLE IF NOT EXISTS` + `ALTER ... catch`).
2. **Templates DOCX** — modelos oficiais versionados no repo com as tags nas 3 sintaxes;
   estrutura de cláusulas em [conformidade-legal.md](references/conformidade-legal.md).
3. **Registry de tags** — lista canônica `MAIUSCULAS_COM_UNDERSCORE`, leitor de tags do DOCX
   (ZipArchive + regex sobre o XML) e validador de tags não suportadas no upload de modelo
   personalizado.
4. **Motor de render (DocxTemplator)** — o componente mais delicado: normaliza placeholders
   fragmentados pelo Word entre `<w:t>`, substitui texto (com `\n`→`<w:br/>`), injeta
   imagens OOXML (logo, assinatura do prestador) e **preserva** os placeholders
   `ASSINATURA_CLIENTE`/`DATA_ASSINATURA` para a etapa de assinatura. Teste com DOCX reais
   salvos pelo Word, não só gerados programaticamente.
5. **Wizard de dados do emissor** — tabela de valores de tags do tenant (CNPJ, banco, foro,
   logo, assinatura desenhada) preenchida uma vez; merge com precedência: dados runtime do
   evento NUNCA são sobrescritos pelos institucionais.
6. **Resolver de modelo** — prioridade: modelo personalizado escolhido manualmente SEMPRE
   prevalece; modelo oficial escolhido só vale se ativo E compatível com o tipo do evento;
   fallback roteia tipo de evento → template oficial. Valide existência do arquivo com
   auto-reparo.
7. **Endpoints de fluxo** — rascunho (upsert + status `aguardando_revisao`) e geração final
   (render → `contratos_gerados/{ext}/Y/m/` → status `gerado`). Bloqueie regeneração de
   contrato `assinado`. Efeitos colaterais (e-mail, calendar, cobrança) sempre em try/catch
   para nunca abortar a geração.
8. **Conversão PDF** — wrapper HTTP para Stirling PDF (`POST /api/v1/convert/file/pdf`) ou
   LibreOffice headless. Download protegido com `realpath` containment.
9. **Assinatura digital** — serviço de token + página pública + endpoint + injeção da
   assinatura no DOCX + hashes. Siga [assinatura-e-seguranca.md](references/assinatura-e-seguranca.md)
   à risca, INCLUINDO a seção "Melhorias obrigatórias" (a referência tem lacunas conhecidas:
   sem rate-limit no CPF, aceite não persistido, CPF em texto puro, sem validador público).
10. **Conformidade legal** — cite a base legal no documento e na UI; persista o texto do
    aceite com versão; implemente a página pública de validação por `codigo_verificacao`.

## Decisões de projeto que importam (não mude sem motivo)

- **Token nunca persiste em claro**: grave só `hash('sha256', $token)`; o token raw com
  256 bits (`bin2hex(random_bytes(32))`) só existe na URL. Um link válido por contrato:
  ao reemitir, cancele os `pendente` anteriores.
- **Hash do documento ASSINADO** (DOCX e PDF) gravado no banco e **recalculado a cada
  download** — se divergir, bloqueie e logue. Melhore a referência: guarde também o hash
  do preview que o cliente visualizou (prova do que foi aceito) e não seja fail-open
  quando o hash armazenado estiver vazio.
- **Identidade do signatário** = CPF digitado conferido contra o cadastro + traçado no
  canvas + IP/user-agent/timestamp. Adicione rate-limit e, ideal, OTP por e-mail.
- **Código de verificação** = `HMAC-SHA256(id|cpf|timestamp, APP_KEY)` truncado a 12 hex,
  carimbado no documento — é o número de protocolo verificável.
- **O escopo multi-tenant vem do token**, nunca do request: tenant_id/evento_id são lidos
  do registro resolvido pelo token.
- **Documento assinado é arquivo NOVO** (`*_ASSINADO_<ts>.docx/pdf`); o original permanece.

## Gotchas (cicatrizes da implementação de referência)

- O Word **fragmenta placeholders** em múltiplos runs `<w:t>` (revisões, corretor
  ortográfico). Sem a passada de normalização, `[NOME_CLIENTE]` aparece como
  `[NOME_` + `CLIENTE]` e a substituição falha silenciosamente.
- Placeholders de assinatura do cliente devem ser **preservados** na geração e preenchidos
  só na assinatura — se o templator os limpar como "tag vazia", não há onde injetar a
  assinatura depois.
- Campos opcionais: a tag carrega a **frase pronta** (ex.: `TEMA_FESTA` = `O tema da festa
  será "X".` ou string vazia), e o templator colapsa parágrafos vazios — assim o template
  não fica com frases mutiladas.
- `X-Forwarded-For` é spoofável: registre, mas só confie atrás de proxy conhecido.
- Na referência, o injetor de assinatura (`DocxSignatureInjector`) existia só no servidor,
  fora do versionamento — **versione tudo**.
- Conversor PDF externo cai: trate timeout/erro do Stirling como degradação (entregue DOCX
  assinado + hash) e não como falha da assinatura.
