---
name: migrate-tenant-data-safely
description: "Planeje, implemente ou audite exportação, importação e cutover de dados tenant-scoped com inventário de dependências, manifesto, checksums, remapeamento de IDs, arquivos, dry-run, reconciliação, rollback e preservação do legado. Use quando mover uma empresa entre bancos/sistemas, consolidar ambientes, restaurar um tenant ou corrigir importadores que fazem merge cruzado por CPF, CNPJ ou e-mail."
---

# Migrar dados de tenant com segurança

## Objetivo

Mova um tenant como conjunto consistente e verificável. Não apague a origem nem faça merge heurístico destrutivo enquanto a nova cópia não estiver reconciliada e aceita.

## Começar pelo inventário

1. Resolva o tenant de origem e prove autorização.
2. Liste tabelas, arquivos, tokens, jobs, integrações e relações externas.
3. Construa o grafo de dependências e identifique IDs globais, compostos e públicos.
4. Leia [fases-e-reconciliacao.md](references/fases-e-reconciliacao.md).
5. Defina freeze, delta, janela de cutover, rollback e critérios de aceite.

## Exportar um pacote autodescritivo

- Gere manifest com versão do schema, tenant, instante, tabelas, contagens, arquivos e checksums.
- Exporte somente linhas pertencentes ao tenant, incluindo tabelas de junção e histórico.
- Redija ou exclua segredos que não devem atravessar ambientes.
- Preserve relações por IDs lógicos no pacote.
- Inclua catálogo de arquivos com tamanho, hash e finalidade.
- Assine ou proteja o pacote conforme sensibilidade; criptografe em trânsito e repouso.
- Não inclua dados de outros tenants por joins sem filtro.

## Validar antes de importar

- Rejeite versão incompatível ou pacote adulterado.
- Confira checksums, contagens e referências ausentes.
- Faça dry-run que produza plano de criação, reaproveitamento, conflito e bloqueio.
- Classifique colisões por escopo: global técnico, público global ou único apenas no tenant.
- Nunca resolva pessoa por CPF, CNPJ, telefone ou e-mail sem restringir ao tenant destino.
- Exija decisão explícita para merges ambíguos.

## Remapear IDs deterministically

1. Crie o tenant destino ou selecione-o com prova reforçada.
2. Importe entidades raiz e grave um id_map por tabela/tipo.
3. Reescreva chaves estrangeiras usando o mapa.
4. Preserve IDs públicos opacos apenas se não colidirem e a política permitir.
5. Gere novos tokens/segredos quando reutilização puder cruzar ambientes.
6. Faça upsert somente com chave composta que inclua tenant e identidade correta.
7. Registre cada conflito e resolução no relatório.

## Importar em fases recuperáveis

- Use transações por unidade coerente, não uma transação gigante.
- Marque a execução com migration_run_id e estados.
- Faça cada fase idempotente e retomável.
- Copie arquivos para staging, valide hash e só então promova.
- Não dispare e-mails, webhooks, cobranças ou mensagens durante carga histórica.
- Reative jobs somente depois da reconciliação.
- Preserve fonte e pacote original até expirar a janela de rollback autorizada.

## Tratar integrações externas

- Não copie credenciais de produção para outro ambiente.
- Revalide ownership de customer, subscription, calendar event, provider message e storage key.
- Decida se IDs externos serão religados, recriados ou desativados.
- Pause webhooks/jobs durante a janela que possa gerar escrita dupla.
- Use outbox/delta para eventos ocorridos entre snapshot e freeze.
- Rode reconciliação após reativar.

## Executar cutover

1. Faça pré-check e backup verificado.
2. Ative freeze ou modo somente leitura na origem.
3. Exporte/aplique o delta final.
4. Rode validações de schema, contagens, somas e amostras relacionais.
5. Troque roteamento/acesso.
6. Execute smoke tests com contas autorizadas.
7. Monitore erros e indicadores.
8. Mantenha rollback pronto até o ponto de não retorno declarado.

## Reconciliar

- Compare contagens por entidade e status, não apenas total de linhas.
- Reconcile somas financeiras em centavos por moeda e regime.
- Verifique arquivos por hash e referências sem arquivo.
- Procure órfãos, links cruzados e IDs externos duplicados.
- Teste acesso cruzado entre dois tenants.
- Registre diferenças esperadas e bloqueie conclusão com divergência inexplicada.

## Validar falhas

- Interrupção após cada fase e retomada.
- Pacote aplicado duas vezes.
- Colisão de slug/token/remote ID.
- Mesmo CPF/CNPJ/e-mail em tenants diferentes.
- Arquivo ausente ou hash inválido.
- Webhook chegando durante freeze.
- Rollback antes e depois do cutover.
- Fonte continua intacta após importação falha.

## Critérios de conclusão

Considere pronto quando o pacote é íntegro e versionado, a importação é idempotente e retomável, contagens/finanças/arquivos estão reconciliados e existe caminho de rollback sem apagar a origem.
