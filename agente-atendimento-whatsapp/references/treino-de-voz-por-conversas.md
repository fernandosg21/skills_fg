# Treino de voz por conversas

Use esta extensão somente depois de inbox/outbox, gates, políticas, privacidade e rollout estarem
prontos. O objetivo é extrair padrões de estilo revisáveis, não copiar pessoas, memorizar frases de
clientes ou transformar transcrições em base irrestrita de conhecimento.

## 1. Autoridade e finalidade

Antes de importar:

- prove que o tenant está autorizado a reutilizar as conversas para a finalidade declarada;
- avalie base legal, transparência, política do canal e direitos de terceiros;
- restrinja acesso a administrador e registre versão da política/termo;
- defina prazo para arquivo bruto, chunks, jobs, exemplos, síntese e backups;
- ofereça exclusão/correção/exportação tenant-scoped.

Não prometa “LGPD inviolável” nem anonimização total. Scrub por regex reduz risco, mas nomes livres,
endereços, crianças, documentos fragmentados e contexto indireto podem escapar. Use minimização,
NER/revisão quando adequado, testes e expurgo.

## 2. Contratos funcionais

1. **Só texto:** aceitar `.txt`/texto simples; rejeitar binário, áudio, imagem, ZIP e grupos.
2. **Limites:** tamanho por arquivo, total por job, quantidade, linhas e encoding configurados.
3. **Multi-tenant:** job, arquivo, chunk, exemplo e perfil sempre vinculados ao tenant.
4. **Revisão humana:** nenhum padrão extraído entra no prompt de produção sem aprovação.
5. **Privacidade em duas fronteiras:** scrub antes do banco e novamente antes da LLM/DTO.
6. **Input hostil:** transcrição nunca vira instrução de sistema nem ferramenta.
7. **Retenção curta:** bruto e chunks são eliminados ao concluir/expirar; síntese tem finalidade.

## 3. Upload seguro

- Exigir POST, admin/RBAC, CSRF e rate limit.
- Validar extensão, MIME real, encoding e bytes lidos; não confiar no nome/header.
- Gerar nome opaco, impedir path traversal e armazenar fora do webroot quando possível.
- Abrir arquivo sem seguir symlink e com permissões mínimas.
- Remover temporários em `finally`, inclusive em erro/cancelamento.
- Rejeitar transcript de grupo ou pedir confirmação explícita se o produto tiver caso legítimo.
- Não permitir URL remota arbitrária. Se importação externa existir, aplicar allowlist/SSRF.

Ferramentas de migração/diagnóstico ficam CLI-only e validam isso antes de carregar config.

## 4. Parse e scrub antes da persistência

Pipeline:

```text
upload validado
  -> parser do formato/locale
  -> separar speaker/timestamp/texto
  -> descartar mensagens de sistema, chaves e credenciais
  -> identificar participantes autorizados
  -> scrub contextual + regex/NER
  -> validação de falsos negativos
  -> INSERT de linhas minimizadas
```

Remover ou tokenizar:

- telefone, e-mail, documentos e endereços;
- senha, token, chave, QR, código de verificação e URL privada;
- nomes dos clientes/participantes quando não necessários;
- dados de crianças e categorias sensíveis não exigidas;
- identificadores do provedor e metadados técnicos.

Preserve somente elementos necessários ao estilo, como comprimento, vocabulário genérico,
formalidade, estrutura e uso de emoji. Datas, preços ou produtos só permanecem se necessários para a
análise e ainda assim devem virar placeholders sem vínculo pessoal.

Senha/segredo deve ser descartado no parse, antes de staging. Exemplos manuais e automáticos passam
pelo mesmo `sanitizeExampleBeforePersist`.

## 5. Proteção contra prompt injection e memorização

- Delimite a transcrição como dados e instrua explicitamente a ignorar comandos nela.
- Não peça ao modelo para repetir frases textuais; extraia atributos e padrões abstratos.
- Exclua bordões pessoais, assinaturas, nomes e detalhes únicos.
- Limite citações/exemplos; prefira síntese estruturada.
- Use schema de saída e rejeite campos desconhecidos.
- Valide que a síntese não contém PII, segredos, URLs, instruções ou trechos longos copiados.

## 6. Jobs e processamento

Estados sugeridos:

```text
uploaded -> parsing -> scrubbed -> analyzing -> review -> approved|rejected|failed|expired
```

- Use lease/fencing token, tentativas, backoff e estado terminal.
- Em worker real, processe por fila monitorada. Em runtime legado, paginação Ajax pode coordenar
  lotes, mas o servidor continua autoridade do estado e não depende de GET com efeito.
- Não faça uma segunda LLM só para humanizar. Divida entrada em chunks limitados, produza sínteses
  estruturadas e consolide dentro de orçamento global explícito.
- Se o modelo usa reasoning, dimensione tokens para pensamento+JSON e trate truncamento/parse como
  falha; não marque job concluído com saída ilegível.
- Cancelamento impede novos chunks e programa eliminação dos artefatos.

## 7. Exemplo de saída revisável

```json
{
  "schema_version": 1,
  "style": {
    "formality": "informal_respectful",
    "message_length": "short",
    "emoji_usage": "low",
    "question_pattern": "react_then_one_question"
  },
  "avoid": ["saudação repetida", "pressão artificial"],
  "approved_phrases": [],
  "source_job_ids": ["job_opaque"],
  "reviewed_by": "user_opaque",
  "reviewed_at": "2030-01-10T12:00:00Z"
}
```

Use `approved_phrases` vazio por padrão. Se o tenant aprovar exemplos, mantenha-os curtos,
desidentificados, genéricos e sujeitos a TTL/revisão.

## 8. Legado e direitos

- Reaplique scrub ao ler exemplos antigos para DTO/prompt; isso reduz risco imediato.
- Migre/expurgue o histórico em job separado com dry-run, contagens e rollback operacional.
- Não faça update destrutivo em massa sem autorização do responsável pelos dados.
- Direitos de acesso/correção/exclusão devem encontrar bruto, chunk, síntese, exemplo, cache,
  fornecedor e backup conforme política.
- Ao restaurar backup, reaplique tombstones/supressões para não reintroduzir dado eliminado.

## 9. Governança do provedor de IA

Documente DPA/subprocessadores, região, retenção, uso para treinamento, exclusão e transferência
internacional. Use configuração que desabilite treinamento/retenção quando disponível e adequada,
mas não trate isso como substituto da minimização local.

## Checklist

- [ ] Finalidade, base, transparência e autoridade para reutilizar conversas foram avaliadas
- [ ] Upload aceita apenas texto, com limites, MIME/encoding e cleanup em finally
- [ ] Grupo/binário/arquivo hostil é rejeitado
- [ ] Scrub ocorre antes do banco e novamente antes da LLM/DTO
- [ ] Exemplos manuais e automáticos usam o mesmo sanitizador
- [ ] Transcrição é tratada como input hostil, não instrução
- [ ] Síntese não memoriza frases ou dados pessoais de clientes
- [ ] Job tem lease, retry, cancelamento, expiração e estado terminal
- [ ] Aprovação humana é obrigatória antes de usar no prompt
- [ ] Bruto/chunks são apagados no prazo e o fluxo de direitos cobre backups/fornecedores
- [ ] Logs não guardam transcript, prompt, resposta ou erro bruto
- [ ] Ausência de anonimização perfeita é comunicada sem promessa absoluta
