# Schema e ciclo de vida (referência: Memora)

Citações `arquivo:linha` referem-se a `a:\Site Fotografia\Memora.fot.br`.
Todas as tabelas usam migração idempotente em runtime: `CREATE TABLE IF NOT EXISTS` +
lista de `ALTER TABLE ... ADD COLUMN` dentro de try/catch (padrão `ensureTable()`).

## 1. Tabela central de assinaturas — `assinaturas_contrato`

DDL real (`includes/SignatureService.php:26-68`):

```sql
CREATE TABLE IF NOT EXISTS assinaturas_contrato (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,                  -- isolamento multi-tenant
    evento_id INT NOT NULL,                  -- o "pedido/job" dono do contrato
    cliente_id INT NOT NULL,                 -- signatário
    token_hash VARCHAR(64) NOT NULL,         -- SHA-256 do token; raw NUNCA persiste
    status ENUM('pendente','assinado','expirado','cancelado') NOT NULL DEFAULT 'pendente',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,             -- +30 dias
    assinado_em DATETIME NULL,
    assinatura_imagem_path VARCHAR(500) NULL,   -- PNG do canvas
    assinatura_hash VARCHAR(64) NULL,           -- SHA-256 do PNG
    hash_docx_assinado VARCHAR(64) NULL,        -- SHA-256 do DOCX final
    hash_pdf_assinado VARCHAR(64) NULL,         -- SHA-256 do PDF final
    codigo_verificacao VARCHAR(16) NULL,        -- HMAC truncado, carimbado no doc
    ip_assinatura VARCHAR(45) NULL,
    user_agent TEXT NULL,
    cpf_confirmado VARCHAR(20) NULL,
    arquivo_contrato_assinado VARCHAR(500) NULL,      -- caminho DOCX assinado
    arquivo_contrato_assinado_pdf VARCHAR(500) NULL,  -- caminho PDF assinado
    arquivo_contrato_preview_pdf VARCHAR(500) NULL,   -- PDF que o cliente leu
    enviado_email TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_token_hash (token_hash),
    KEY idx_tenant_evento (tenant_id, evento_id),
    KEY idx_status (tenant_id, status),
    KEY idx_expira_em (expira_em),
    KEY idx_codigo_verificacao (codigo_verificacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- + colunas opcionais de cobrança: exibir_asaas_pagamento, asaas_event_payment_id
```

## 2. Tabelas do pipeline de geração

| Tabela | Papel | DDL |
|---|---|---|
| `modelos_contrato` | Biblioteca de modelos do tenant (`template_key` cheia = oficial, vazia = personalizado) | `contract_models.php:1100-1112` |
| `tenant_contract_template_usage` | Quais oficiais estão ativos por tenant (`is_enabled`) | `contract_models.php:1135-1154` |
| `tenant_contract_custom_templates` | Uploads personalizados (nome, path, uploaded_by) | `contract_models.php:1167-1199` |
| `tenant_contract_tag_values` | Valores institucionais do wizard (CNPJ, banco, foro, logo, assinatura do emissor) | wizard `adm/api/contratos_wizard_salvar.php` |
| `modelo_contrato_defaults` | Modelo default por tipo de evento | `contract_models.php:2412-2431` |
| `contract_extra_items` | Excedentes globais (hora extra etc., com seed default) | `contract_extras.php:25-41` |

## 3. Colunas de contrato no agregado principal (`eventos`)

```
status_contrato     ENUM-like: nao_gerado | aguardando_revisao | gerado | assinado
arquivo_contrato    caminho relativo do DOCX gerado
modelo_contrato_id  modelo congelado na revisão (FK lógica p/ modelos_contrato)
contract_profile    perfil que troca textos (auto | recreacao_infantil)
pacote_personalizado_json  pacote custom serializado
```

## 4. Ciclo de vida (transição → responsável)

```
nao_gerado
   │  salvar rascunho (adm/api/contrato_salvar_rascunho.php)
   ▼
aguardando_revisao          ← congela modelo_contrato_id, gera parcelas
   │  gerar contrato (adm/api/gerar_contrato_admin.php)
   ▼
gerado                      ← DOCX em contratos_gerados/, preview PDF,
   │                          token em assinaturas_contrato (pendente),
   │                          e-mail + link WhatsApp ao cliente
   │  cliente assina (api/salvar_assinatura.php via /assinatura/{token})
   ▼
assinado                    ← *_ASSINADO_<ts>.docx/pdf + hashes,
                              regeneração BLOQUEADA (gerar_contrato_admin.php:79-84),
                              notificação ao admin
```

Token paralelo: `pendente → assinado | expirado (lazy, +30d) | cancelado (reemissão)`.

## 5. Armazenamento de artefatos

```
contratos_gerados/docx/Y/m/Contrato_<NomeSeguro>_<YmdHis>.docx     (gerado)
contratos_gerados/pdf/Y/m/<base>_preview.pdf                       (preview p/ leitura)
contratos_gerados/docx/Y/m/<base>_ASSINADO_<ts>.docx               (assinado)
contratos_gerados/pdf/Y/m/<base>_ASSINADO_<ts>.pdf                 (assinado)
uploads/assinaturas/{tenant}/Y/m/evento_{id}_{ts}.png              (traçado)
adm/uploads/modelos_personalizados/{tenant}/custom_<slug>_<ts>.ext (modelos custom)
```

Downloads sempre com `realpath` containment no diretório base (anti path-traversal):
`adm/pdf.php:19-47`, `api/baixar_contrato_assinado.php:34-39`.

## 6. Integrações no fluxo (todas best-effort, em try/catch)

- **E-mail**: link de assinatura ao cliente (`SignatureService::enviarEmailAssinatura`,
  292-342); resumo ao admin na geração e na assinatura.
- **WhatsApp**: URL wa.me pré-montada com mensagem (não envia automático; o admin clica).
- **Cobrança (Asaas)**: link de pagamento opcional exibido na página de assinatura
  (`exibir_asaas_pagamento`/`asaas_event_payment_id`).
- **Google Calendar**: sync do evento na geração.
- **Notificações internas**: `admin_notifications` na assinatura.

Regra de ouro: **nenhuma integração pode abortar a geração ou a assinatura** — falhou,
loga e segue.

## 7. Checklist de schema mínimo para replicar

1. Agregado principal (pedido/evento/projeto) com `status_contrato`, `arquivo_contrato`,
   `modelo_contrato_id`.
2. Cadastro do signatário com CPF/CNPJ (para a conferência de identidade).
3. `assinaturas_contrato` (DDL acima — copie inteira; é o coração das evidências).
4. `modelos_contrato` + `tenant_contract_template_usage` + `tenant_contract_custom_templates`
   (se houver multi-tenant; senão, uma tabela única de templates).
5. `tenant_contract_tag_values` (dados institucionais do emissor).
6. Opcional: `contract_extra_items`, `modelo_contrato_defaults`, tabela de parcelas.
7. Recomendado (melhoria sobre a referência): tabela `contrato_eventos_log` append-only
   (id, assinatura_id, evento: gerado|enviado|visualizado|assinado, ip, user_agent,
   payload JSON, hash_anterior, created_at) para trilha de auditoria encadeada.
