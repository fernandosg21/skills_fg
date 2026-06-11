# Assinatura digital: fluxo, evidências, inviolabilidade (referência: Memora)

Citações `arquivo:linha` referem-se a `a:\Site Fotografia\Memora.fot.br`.
Serviço central: `includes/SignatureService.php` (classe `SignatureService`).

## 1. Token do link de assinatura

```php
$token     = bin2hex(random_bytes(32));   // 64 hex = 256 bits, CSPRNG
$tokenHash = hash('sha256', $token);      // SÓ o hash vai ao banco
$expiraEm  = (new DateTime('+30 days'))->format('Y-m-d H:i:s');
```
(`SignatureService.php:107-109`)

- Banco guarda apenas `token_hash VARCHAR(64) UNIQUE` — vazamento do banco não permite
  forjar links. Token raw existe só na URL `BASE_URL/assinatura/{token}`.
- Rota amigável restringe a `[a-fA-F0-9]{64}` já no `.htaccess` (linhas 313-314); a
  validação PHP repete `preg_match('/^[a-f0-9]{64}$/i')` antes de hashear
  (`SignatureService.php:147-183`).
- **Um link válido por contrato**: ao gerar novo token, os `pendente` do mesmo
  evento/tenant viram `cancelado` (`SignatureService.php:101-105`).
- Expiração lazy: token `pendente` vencido é marcado `expirado` na validação (176-180).
- Retorno de `gerarToken()` inclui `signatureUrl` e `whatsappUrl` (wa.me com mensagem
  pronta) para o admin enviar (122-130).

## 2. Página pública de assinatura (`assinatura.php`)

Estados: link inválido / expirado / já assinado (com botão de download) / pendente.
No pendente, 4 passos (linhas 258-352):
1. **Ler o contrato** — iframe com o PDF preview servido por
   `/api/baixar_contrato_preview.php?token=...`.
2. **Assinar** — canvas com `signature_pad@4.2.0`.
3. **Confirmar identidade** — input de CPF; exibe dica mascarada `***.XXX.***-**`.
4. **Aceite + envio** — checkbox "Li e concordo com os termos descritos no contrato";
   botão só habilita com CPF de 11 dígitos + traçado + checkbox (399-403).

## 3. Endpoint de assinatura (`api/salvar_assinatura.php`)

POST JSON `{ token, signatureDataUrl, cpf }`. Sequência:
1. Revalida token + status (42-59); rejeita reassinatura ("já foi assinado", 52-54).
2. Compara CPF digitado com o do cadastro (62-66).
3. Valida PNG base64: prefixo `data:image/png;base64,`, 100B–500KB (69-82).
4. Salva PNG em `uploads/assinaturas/{tenant}/Y/m/evento_{id}_{ts}.png` (88-97).
5. **Injeta no DOCX** via `DocxSignatureInjector` preenchendo os placeholders preservados
   (`ASSINATURA_CLIENTE`/`DATA_ASSINATURA`) + carimbo de metadados: nome, CPF mascarado,
   IP, data/hora, código de verificação (payload em 132-138). Gera arquivo NOVO
   `*_ASSINADO_<ts>.docx`.
6. Converte para PDF assinado via Stirling (156-169).
7. Persiste evidências e hashes (`marcarAssinado`, `SignatureService.php:190-220`).
8. `UPDATE eventos SET status_contrato='assinado'` + notifica admin (197-215).

**Escopo multi-tenant vem do token**: `tenant_id`/`evento_id` saem do registro resolvido,
nunca do request (84-85).

## 4. Evidências coletadas

| Evidência | Origem | Coluna |
|---|---|---|
| IP | `HTTP_X_FORWARDED_FOR` ?? `REMOTE_ADDR` | `ip_assinatura VARCHAR(45)` |
| User-Agent | truncado a 1000 chars | `user_agent TEXT` |
| Data/hora | `NOW()` no DB + `DateTime` America/Sao_Paulo carimbado no doc | `assinado_em DATETIME` |
| CPF confirmado | comparado com cadastro | `cpf_confirmado VARCHAR(20)` |
| Traçado | PNG do canvas + SHA-256 do PNG | `assinatura_imagem_path`, `assinatura_hash` |
| Código de verificação | HMAC (abaixo) | `codigo_verificacao VARCHAR(16)` |

```php
$codigoVerificacao = strtoupper(substr(
    hash_hmac('sha256', $registro['id'].'|'.$cpfDigitado.'|'.$agora->format('YmdHis'), APP_KEY),
    0, 12
));   // api/salvar_assinatura.php:127-130 — protocolo carimbado no documento
```

## 5. Inviolabilidade

Três SHA-256 distintos:
1. `assinatura_hash` — do PNG do traçado.
2. `hash_docx_assinado` — `hash_file('sha256', ...)` do DOCX assinado.
3. `hash_pdf_assinado` — do PDF assinado.

**Verificação a cada download** (`verificarIntegridade`, `SignatureService.php:252-270`,
chamada em `api/baixar_contrato_assinado.php:40,62`): recalcula o hash do arquivo e
compara; divergência → bloqueia download, HTTP 500, `error_log('INTEGRIDADE CONTRATO …')`.

Limites da referência (corrigir na reimplementação — ver §7):
- Imutabilidade é **lógica** (hash no banco), não física (sem WORM, sem PAdES). Quem tem
  acesso a arquivo + banco simultaneamente pode regravar ambos.
- `verificarIntegridade` é **fail-open** quando o hash armazenado está vazio (259-261).
- Só o documento **assinado** é hasheado; o preview que o cliente leu não.

## 6. Pós-assinatura

- E-mail ao admin com resumo e `reply_to` do cliente (`notificarAdminAssinado`,
  `SignatureService.php:347-418`). (Referência NÃO envia cópia ao cliente — melhorar.)
- Comprovante: a própria página no estado `jaAssinado` + download em
  `/api/baixar_contrato_assinado.php?token=...` (PDF preferido, fallback DOCX), sempre com
  verificação de integridade. Downloads com `realpath` containment
  (`baixar_contrato_assinado.php:34-39,55-60`).
- Admin: `adm/ver_contrato.php` prioriza o PDF assinado e mostra badge "Contrato assinado".
- Reenvio de link: `adm/api/reenviar_assinatura.php` (gera token novo, cancela o antigo).

## 7. Melhorias obrigatórias ao reimplementar

A referência funciona, mas tem lacunas conhecidas. Implemente desde o início:

1. **Rate-limit + lockout no CPF** (o endpoint é público; CPF é brute-forçável por quem
   tem o link). Ideal: OTP por e-mail/SMS como segundo fator de autoria.
2. **Persistir o aceite**: texto exato do termo + versão + timestamp no banco (na
   referência o checkbox só trava o botão no front-end; o servidor não verifica).
3. **Hash do documento visualizado** (preview) além do assinado — prova *o que* foi aceito.
4. **Fail-closed**: hash armazenado vazio = erro, não sucesso.
5. **Validador público**: página `/verificar?codigo=XXXX` que busca por
   `codigo_verificacao`, recomputa hashes e exibe metadados — terceiros validam sem acesso
   ao sistema.
6. **Carimbo de tempo confiável**: TSA RFC 3161 / ICP-Brasil ACT, ou ancoragem externa
   (OpenTimestamps) — `NOW()` do servidor não prova data perante terceiros.
7. **Trilha append-only**: log de TODAS as transições (gerado, enviado, visualizado,
   assinado) com IP/timestamp, idealmente hash encadeado.
8. **CPF cifrado/tokenizado** no banco; IP de `X-Forwarded-For` só atrás de proxy confiável.
9. **CSRF/Origin check** no endpoint (JSON + token no corpo mitiga, mas valide `Origin`).
10. **PAdES** (assinatura criptográfica do PDF, mesmo com certificado de servidor): embute
    a integridade no próprio arquivo, verificável por qualquer leitor de PDF.
