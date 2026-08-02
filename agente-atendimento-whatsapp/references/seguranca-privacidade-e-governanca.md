# Segurança, privacidade e governança

Use esta referência ao expor webhook, painel administrativo, treinamento, mídia, logs ou dados
de clientes. Um agente autônomo combina quatro superfícies de alto risco: canal público,
multi-tenant, LLM externo e envio em nome da empresa. Trate cada uma como fronteira de confiança.

## 1. Estado efetivo: todas as autorizações precisam concordar

Calcule a autorização de envio numa função única e reutilize-a no runtime e na interface:

```text
canSend = tenant válido
       && módulo habilitado
       && plano/entitlement permitido
       && configuração de outbound ligada
       && perfil em modo autônomo
       && conversa não pausada
       && finalidade/base/regra do canal autorizam esta mensagem
       && destinatário não suprimiu/revogou
       && contato fora da blocklist
       && dentro do horário de atendimento
       && canal utilizável
```

- Falhar fechado quando plano, tenant, módulo, perfil ou ownership não puderem ser provados.
- Resolver o tenant pela sessão autenticada ou vínculo assinado, nunca por um ID livre do payload.
- Aplicar o gate antes de criar conversa, CRM, memória ou exemplo quando o produto não autoriza o
  módulo; exceções internas devem ser explícitas e mínimas.
- Derivar flags técnicas de um modo único (`off`, `shadow`, `autonomous`) e mostrar na UI exatamente
  os blockers usados pelo motor.
- Não oferecer retomada em massa. Retomar uma conversa por vez, com busca e trilha de auditoria.

## 2. Webhook: autenticar antes de banco, schema e efeitos

Siga esta ordem:

1. Limitar o corpo antes do parse (`Content-Length` e bytes realmente lidos). Definir teto por
   configuração com mínimo/máximo defensivos.
2. Identificar provedor/conta por chave opaca da rota ou header. Resolver o segredo em cofre,
   configuração/cache autenticado ou repositório de credenciais isolado; não depender de abrir o
   banco de negócio antes de autenticar.
3. Validar segredo/HMAC em tempo constante. Para Meta, validar a assinatura do corpo bruto; para
   Evolution, preferir segredo de webhook por instância. Quando o protocolo permitir, validar
   timestamp/nonce e janela de replay.
4. Só depois abrir conexão, executar schema, resolver tenant e persistir.
5. Recusar divergência entre tenant da instância, conta cadastrada e rota/token.
6. Persistir um ID idempotente; sem ID do provedor, usar hash do corpo bruto completo mais o
   namespace do provedor/instância.
7. Responder ACK e processar exatamente o evento persistido; um worker recupera somente eventos
   pendentes/retry elegíveis.

Se o legado guarda o segredo apenas junto da conta no banco de negócio, trate como dívida: crie uma
camada pré-banco mínima/read-only, migre referências para cofre/cache e só então aplique a regra
fail-closed. Não aceite tenant/instância declarados no payload para localizar o segredo.

Nunca usar a chave global da API do provedor como solução permanente para todos os webhooks.
Migrar para segredo por instância com janela de compatibilidade, re-registro, observação e revogação.
Desabilitar redirects no cliente HTTP quando o header carrega segredo, para não reenviá-lo a outro
host.

## 3. Painel e ferramentas operacionais

- Manter GET estritamente read-only. Atualizar conexão, reparar webhook, gerar QR, testar provedor,
  alterar modo ou processar fila somente por POST autenticado, com permissão administrativa e CSRF.
- Não executar worker, reparo remoto ou envio ao abrir dashboard/listagem.
- Bloquear ferramentas de diagnóstico pela web; exigir CLI antes de carregar bootstrap/config.
- Desabilitar smoke/force-production em produção. Em desenvolvimento, exigir confirmação literal e
  tenant explícito.
- Proteger endpoints de cron antes de abrir PDO. Preferir segredo em header; manter query string só
  numa migração temporária e monitorada.
- Aplicar `Cache-Control: no-store` a respostas administrativas sensíveis.
- Devolver DTOs explícitos. Nunca serializar objetos/linhas inteiras de conta ou configuração.

## 4. Segredos

- Nunca devolver token, app secret, verify token ou fragmentos de chave. Expor somente
  `configured: true|false` quando necessário.
- Não persistir segredo em texto puro numa coluna de negócio. Usar cofre ou cifra autenticada com
  chave fora do banco.
- Inventariar o legado antes de migrar. Adicionar armazenamento seguro, copiar/validar, rotacionar no
  provedor e só então remover a origem antiga.
- Não apagar coluna/valor histórico sem prova de que nenhum caminho ainda o consome.
- Separar segredo de API, segredo de webhook e token de cron; comprometimento de um não deve liberar
  as outras superfícies.
- Nunca registrar segredo em log, exceção, URL, diagnóstico ou resposta de health-check.

## 5. Minimização de dados

### Mensagens e webhooks

- Guardar o conteúdo necessário à conversa em colunas canônicas. Não duplicar o envelope inteiro em
  `payload_json`.
- Fazer `store_raw_payload` nascer desligado. Se ligado para diagnóstico, limitar acesso e retenção.
- Ao desligar, apagar o envelope de eventos novos depois do processamento; deixar claro que isso não
  migra o histórico.
- Persistir apenas metadados locais necessários (`source`, ID técnico, direção, MIME). Preferir
  colunas próprias; não guardar resposta completa do provedor.

### Treinamento e exemplos

- Desidentificar antes do INSERT/UPDATE, tanto exemplos manuais quanto automáticos.
- Anular nome/telefone em campos próprios e scrubar texto/JSON para telefone, e-mail, documentos,
  credenciais e nomes conhecidos pelo contexto.
- Reaplicar o scrub ao formar DTO e prompt, protegendo linhas legadas ainda não migradas.
- Não prometer anonimização total: nome livre sem contexto pode escapar sem NER. Minimizar o texto,
  testar falsos negativos e planejar migração/expurgo do histórico.

### Mídia

- Limitar bytes antes e depois de base64/decodificação.
- Validar MIME real com biblioteca de inspeção; não confiar só no header do provedor.
- Renderizar inline apenas tipos permitidos; forçar download para documento/desconhecido.
- Enviar `nosniff`, CSP e política de recurso adequada. Quando possível, limitar no streaming do
  cliente HTTP para não carregar uma resposta gigante inteira na memória.

## 6. Logs e erros

- Em produção, registrar somente categoria, classe, código seguro, bytes, shape/contagem e
  fingerprint. Não registrar prompt, resposta, telefone, texto, `remoteJid`, stack ou mensagem crua.
- Conteúdo de LLM só pode existir em ambiente local/desenvolvimento com debug e flag própria do
  provedor. Uma flag global não deve liberar todos os clientes.
- Tratar campos de `usage` por allowlist; respostas de provedor podem conter chaves inesperadas.
- Devolver erro público genérico. Detalhe operacional vai para log seguro correlacionado por
  fingerprint.
- Aplicar permissões restritas aos arquivos de log, best-effort.
- Separar métricas por `feature`, tenant, provedor, modelo, tier, fallback, latência e motivo.

## 7. Base, consentimento, opt-out e regras do canal

Não confunda o dono ligar o agente com autorização do destinatário. O primeiro é ativação da
feature; o segundo depende da finalidade, da base legal aplicável e das regras vigentes do canal.

- Definir por finalidade a base, origem do contato, versão da política, data e prova necessária.
- Revalidar permissão no momento de mensagem proativa. Resposta a inbound e campanha ativa podem
  obedecer contratos diferentes do provedor.
- Aplicar janela de atendimento e templates aprovados quando o canal exigir. Não instruir a
  contornar política do provedor.
- Detectar antes da LLM pedidos como “pare”, “sair”, “não quero mais” e equivalentes do locale.
- Registrar supressão durável, cancelar somente fila/outbox pré-envio e impedir retomada automática.
  Para `sending|unknown|accepted`, marcar `do_not_retry` e reconciliar; não alegar cancelamento remoto.
- Permitir revogação e oferecer acesso humano de forma simples; não esconder que há automação.
- Não guardar IP cru para consentimento/telemetria quando não for necessário. Se precisar de
  identificador não reversível, usar HMAC com segredo privado e domínio da finalidade; sem chave,
  guardar `NULL`, não hash público.

## 8. Políticas imutáveis e ferramentas

- Separar guardrails de plataforma, política de compromisso, conteúdo do tenant e estilo. O tenant
  pode restringir, mas não revogar segurança, ownership, minimização ou ferramentas permitidas.
- Tratar prompt do tenant, histórico, exemplos, arquivos e resultados de ferramenta como dados não
  confiáveis; nunca interpolar como nova instrução de sistema.
- Executar somente ferramentas allowlisted com schema de entrada e autorização no servidor.
- Proibir URL, SQL, shell, template ou endpoint arbitrário produzido pelo modelo.
- Validar depois da LLM toda afirmação financeira, disponibilidade, prazo e compromisso contra
  fonte canônica. Divergência cai em resposta local segura, fila ou handoff.

## 9. Identidade, SSRF e saída web

- Escopar IDs técnicos por tenant, provedor e conta/instância. Colisão de proprietário aborta e
  abre incidente; nunca escolher o primeiro registro.
- Usar identidade completa do canal como chave. Heurística de últimos dígitos serve só para gerar
  candidatos; zero ou múltiplos candidatos impedem vínculo, alteração e envio.
- Incluir tenant em locks, caches, dedupe, jobs, chunks, mídia, fila, outbox e retries.
- Em download/callback remoto, permitir apenas HTTPS e hosts/portas exatos, resolver DNS de forma
  defensiva, bloquear redes privadas/metadata, limitar bytes e desabilitar redirects com segredo.
- Escapar todo conteúdo ao renderizar; aplicar CSP, `nosniff` e headers adequados. Texto da LLM e
  nome de arquivo continuam não confiáveis.

## 10. Retenção e direitos do titular

Definir antes do go-live uma matriz com finalidade, base legal, prazo, anonimização e exclusão para:

- mensagens e anexos;
- envelopes/status de webhook;
- memória da conversa;
- exemplos e jobs de treinamento;
- outbox/fila/dead-letter;
- decisões do agente e ações CRM;
- logs LLM, provedor e diagnósticos;
- consentimento e auditoria administrativa.

Não confundir toggle de payload bruto com política LGPD. Inventariar e simular antes de migrar;
executar em lotes pequenos, reconciliar contagens e preservar backup conforme a política do projeto.
Nunca apagar histórico sem autorização explícita do responsável pelos dados.

Implementar fluxo tenant-scoped e auditável para localizar, exportar, corrigir, bloquear,
anonimizar/excluir e registrar oposição/revogação. Fazer dry-run, mostrar escopo, aplicar cascata em
mensagens, mídia, memória, exemplos, jobs e provedores quando cabível, e documentar exceções legais.
Backups precisam de prazo de expiração e procedimento que impeça a reintrodução silenciosa de dados
já expurgados. Limpeza probabilística em caminho quente não substitui job determinístico monitorado.

## 11. Governança de fornecedores e transferência

- Inventariar LLM, provedor do canal, storage, observabilidade e subprocessadores.
- Registrar contrato/DPA, finalidade, retenção, uso ou não para treinamento, região, exclusão,
  subprocessadores e mecanismo aplicável de transferência internacional.
- Enviar a cada fornecedor apenas os campos exigidos pela finalidade. Redação por regex reduz risco,
  mas não prova anonimização; falha do redator deve impedir envio externo ou usar resposta local.
- Revisar política e documentação atuais antes de escolher modelo/provedor; detalhes mudam.

## 12. Resposta a incidente

Preparar playbook com: kill switch local por tenant/conta, retorno imediato a `shadow`, bloqueio de
dispatchers, rotação de segredo, revogação de sessão, preservação controlada de evidências,
identificação do escopo, comunicação e correção. Logs do incidente continuam minimizados; acesso ao
conteúdo exige autorização e prazo. Testar o playbook sem usar cliente real.

## Checklist de aceitação

- [ ] Acesso cruzado de tenant retorna 403 e não revela existência do registro
- [ ] Webhook inválido não abre banco, não toca schema e não persiste evento
- [ ] GET do dashboard não envia, não repara e não chama provedor
- [ ] Todas as mutações administrativas exigem permissão + POST + CSRF
- [ ] DTOs e logs não contêm segredo, PII, payload ou erro bruto
- [ ] Exemplos novos são desidentificados antes da persistência; legado é scrubado na leitura
- [ ] Payload bruto nasce desligado e tem retenção explícita quando habilitado
- [ ] Mídia respeita limite, MIME real e headers defensivos
- [ ] Plano/módulo/perfil/pausa/blocklist/horário falham fechados no envio
- [ ] Pedido de opt-out suprime o contato e cancela intenções pendentes sem retomada automática
- [ ] Política editável não pode revogar guardrails nem autorizar ferramenta arbitrária
- [ ] Valores, disponibilidade e compromissos são validados depois da LLM
- [ ] IDs ambíguos ou pertencentes a outro tenant abortam sem efeito colateral
- [ ] Existe plano de rotação para segredo por instância e migração de tokens legados
- [ ] Existe matriz de retenção e procedimento testável de direitos/anonimização/expurgo/backups
- [ ] Fornecedores, subprocessadores, retenção e transferências foram avaliados
- [ ] Kill switch, rotação e resposta a incidente foram ensaiados
