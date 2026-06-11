# Pipeline de geração de contratos (referência: Memora)

Citações `arquivo:linha` referem-se a `a:\Site Fotografia\Memora.fot.br`.

## 1. Fontes de modelo e prioridade

Quatro camadas, da mais genérica à mais específica:

1. **Catálogo oficial embutido** — DOCX versionados no repo (`assets/`), um por tipo:
   `aniversario`, `casamento`, `ensaio`, `corporativo`, `newborn`.
   Catálogo: `memoraOfficialContractTemplateCatalog()` (`includes/contract_models.php:714-744`);
   mapeamento chave→arquivo: `memoraTemplateProntoFilename()` (`contract_models.php:3189-3201`).
2. **Biblioteca por tenant** — tabela `modelos_contrato (id, tenant_id, titulo,
   arquivo_caminho, template_key, atualizado_em)`. Convenção central:
   **`template_key` preenchida = oficial; vazia = personalizado**. Seed/auto-reparo por
   tenant: `memoraEnsureOfficialContractTemplatesForTenant()` (`contract_models.php:1359-1496`).
3. **Ativação por tenant** — `tenant_contract_template_usage (tenant_id, template_key,
   is_enabled)`; salvar exige ≥1 ativo (`contract_models.php:1549-1594`).
4. **Modelos personalizados** — `tenant_contract_custom_templates` + upload `.docx/.odt`
   ≤10MB em `adm/uploads/modelos_personalizados/{tenant}/`, espelhado em `modelos_contrato`
   com `template_key=''` (`memoraSyncCustomTemplateToContractModel`,
   `contract_models.php:1201-1277`; tela `adm/modelo_personalizado.php`).

**Resolver final** — `memoraResolveContractModel(pdo, tenantId, preferredId, tipoEvento,
contractProfile)` (`contract_models.php:2776-2894`), ordem:

1. `preferredId` **personalizado** → sempre vence (fix do commit `0c74e5f`).
2. `preferredId` **oficial** → só se habilitado E `preferredKey === chave derivada do tipo
   do evento` (evita contrato de casamento com template de aniversário).
3. Roteamento tipo→chave oficial: `memoraMapEventTypeToOfficialTemplateKey()`
   (`contract_models.php:1023-1053`) — `ensaio|gestante→ensaio`, `casamento`,
   `corporativo`, `newborn`, resto social → `aniversario`.
4. Cada candidato passa por validação de arquivo com auto-reparo (re-copia o asset
   oficial se sumiu): `memoraValidateContractModelCandidate` (`contract_models.php:2652-2773`).

Há ainda: default por tipo de evento (`modelo_contrato_defaults`) e modelo congelado por
evento (`eventos.modelo_contrato_id`); perfil de negócio (`tenants.business_segment`,
`contract_profile` em pacotes/eventos) que troca textos/campos sem trocar o template
(`contract_models.php:846-908`).

## 2. Sistema de placeholders

- **Sintaxe**: `[TAG]`, `{TAG}` e `{{TAG}}` equivalentes; chave canônica
  `MAIUSCULAS_COM_UNDERSCORE` (`contract_models.php:693-706`).
- **Lista oficial**: `memoraSupportedContractTags()` (`contract_models.php:9-167`, ~140 tags).
  Grupos: emissor/wizard (`NOME_DA_SUA_EMPRESA, SEU_CNPJ, SEU_BANCO, SUA_CHAVE_PIX,
  UF_DO_FORO, LOGO_DA_EMPRESA…`), cliente PF (`NOME_CLIENTE, CPF_CLIENTE, ENDERECO…`),
  cliente PJ (`RAZAO_SOCIAL, CNPJ_EMPRESA, NOME_RESPONSAVEL…`), evento (`TIPO_EVENTO,
  DATA_FESTA, LOCAL_FESTA…` + variantes por tipo), pacote/valores (`PACOTE_NOME,
  CONTEUDO_PACOTE, VALOR_TOTAL, FORMA_PAGAMENTO…`), prazos (`PRAZOS_ENTREGA,
  DATA_LIMITE_ENTREGA_FINAL…`), excedentes/extras (`EXCEDENTES_*`, `SERVICOS_EXTRAS_*`
  + tags dinâmicas por slug), assinatura (`ASSINATURA_CLIENTE, ASSINATURA_FOTOGRAFO,
  DATA_ASSINATURA, DATA_HOJE, USO_IMAGEM`).
- **Auditoria de modelo enviado**: abre o ZIP, strip de XML, regex `\[([A-Z0-9_]{2,})\]`
  e `\{\{...\}\}` (`memoraReadContractModelTags`, `contract_models.php:3005-3160`);
  tags não suportadas geram aviso ao usuário (`memoraFindUnsupportedContractTags`, 3163-3187).

### Resolução de valores (ordem de montagem do array de dados)

1. **Evento/cliente** — montado pelo gerador (`adm/api/gerar_contrato_admin.php:333-514`).
   Padrão importante: tags opcionais carregam a **frase completa condicional**
   (ex.: `TEMA_FESTA => 'O tema da festa será "X".'` ou `''`), para o template engolir
   campos vazios sem mutilar frases.
2. **Pacote** — busca por id/nome (`memoraFindContractPackage`, `contract_models.php:464-518`)
   ou pacote personalizado serializado em `eventos.pacote_personalizado_json`
   (`includes/custom_package_helpers.php`). Itens viram bullets formatados.
3. **Prazos de entrega** — cálculo de dias úteis + datas-limite, com tags dinâmicas
   `PRAZO_<SLUG>_DIAS_UTEIS` (`includes/delivery_deadlines.php:515+`).
4. **Excedentes globais do tenant** — tabela `contract_extra_items` com seed default;
   gera blocos `EXCEDENTES_CONTRATO/LISTA/TABELA/RESUMO` (`includes/contract_extras.php:251-323`).
5. **Serviços extras do evento** — `includes/service_upsells.php:517+`.
6. **Tags institucionais (wizard)** — `memoraMergeTenantContractTags`
   (`contract_models.php:2037-2167`): merge por último, **sem sobrescrever** tags geradas
   em runtime (allowlist), com fallback do perfil do tenant e validação do arquivo da logo.

## 3. Motor de render — DocxTemplator

`includes/DocxTemplator.php` — edita o XML do DOCX direto no ZIP, sem libs externas.

- Processa `word/document.xml` + todos os `header*.xml`/`footer*.xml` (linhas 429-443).
- **Normalização de placeholders fragmentados**: o Word quebra `[TAG]` em vários runs
  `<w:t>` (proofErr, revisões); `normalizePlaceholders` (20-201) reconstrói; fallback
  `smartRegexReplace` (1009-1037) com regex `(\[|\{\{|\{)((?:<[^>]+>|[^\]\}])+)(\]|\}\}|\})`
  + `strip_tags` da chave. **Sem isso a substituição falha silenciosamente.**
- **Texto**: escapa XML, `\n`→`<w:br/>`, `\t`→`<w:tab/>`; chaves multilinhas (excedentes,
  prazos) viram parágrafos OOXML reais; listas de pacote com indent fixo.
- **Imagens**: `LOGO_DA_EMPRESA` e `ASSINATURA_FOTOGRAFO` viram `<w:drawing>` completo
  (blip + relationship + `[Content_Types].xml`), escala EMU limitada (622-766).
- **Preservação para assinatura**: `ASSINATURA_CLIENTE`/`DATA_ASSINATURA` NÃO são
  substituídos na geração (`preserveForClientSignaturePlaceholders`, 638-644) — ficam no
  DOCX para o injetor de assinatura preencher depois.
- **Limpeza**: colapsa parágrafos vazios preservando page-breaks, remove vírgulas/espaços
  duplicados (208-239, 961-1062).
- Saída: `saveAs($path)` ou `output()`. Variante `OdtTemplator` opcional para `.odt`.

## 4. Fluxo de criação

1. **Wizard do tenant** (uma vez): tela multi-etapas grava `tenant_contract_tag_values`
   (CNPJ, banco, foro…) + upload de logo (GD→PNG h=100) + assinatura desenhada em canvas
   (data-URL→PNG) (`adm/api/contratos_wizard_salvar.php:189-258,417-426`).
2. **Rascunho**: `adm/api/contrato_salvar_rascunho.php` — upsert de `eventos` com
   `status_contrato='aguardando_revisao'`, congela `modelo_contrato_id`, gera parcelas.
3. **Geração final**: `adm/api/gerar_contrato_admin.php` — bloqueia se `assinado` (79-84);
   monta dados; resolve modelo; renderiza; grava em
   `contratos_gerados/{docx|odt}/Y/m/Contrato_<Nome>_<YmdHis>.ext`; atualiza
   `status_contrato='gerado'`; efeitos colaterais em try/catch (preview PDF, token de
   assinatura + e-mail/WhatsApp, Google Calendar, cobrança).
4. **Fluxo público opcional**: formulário do cliente via `pacotes.public_link_token`
   (`gerar_contrato.php` PF / `gerar_contrato_empresa.php` PJ) com validação anti-fraude
   de preço/desconto no backend (`gerar_contrato.php:82-93,217-233`).

**Estados**: `nao_gerado → aguardando_revisao → gerado → assinado` (regeneração bloqueada).

## 5. Materialização

| Artefato | Mecanismo | Local |
|---|---|---|
| DOCX gerado | `DocxTemplator->saveAs()` | `contratos_gerados/{ext}/Y/m/`; caminho em `eventos.arquivo_contrato` |
| PDF preview | Stirling PDF via cURL (`includes/DocxToPdfConverter.php:18-109`, env `STIRLING_PDF_URL/API_KEY`) | `contratos_gerados/pdf/Y/m/<base>_preview.pdf` |
| Download | endpoint com `realpath` containment dentro de `contratos_gerados/` (`adm/pdf.php:19-47`) | — |

Não há HTML intermediário: nasce DOCX, vira PDF só por conversão.
