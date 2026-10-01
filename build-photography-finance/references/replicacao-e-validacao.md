# Replicação e validação

Responsável: Codex. Comece pela matriz do [inventário](inventario-e-fluxos.md). Este documento define um contrato portátil; paths PHP em evidências são rastros do sistema de origem.

## Modelo lógico mínimo

| Entidade | Campos e relações essenciais |
|---|---|
| Escopo | tenant, usuário, proprietário financeiro, papel/permissões; origem de vínculos entre empresas |
| Categoria/fornecedor/conta | tenant/owner, ID, nome, tipo, ativo, metadados; conta principal por escopo |
| Contrato/evento | cliente, data econômica, estado, preço original/final, deslocamento/extras incluídos, método e snapshots |
| Parcela | tenant/evento, número/total, devido, vencimento, estado; pagamentos/aplicações como autoridade |
| Pagamento | parcela/evento, valor, data, método, conta ou sem caixa, autor, origem, referência externa/crédito |
| Avulsa/crédito cliente | descrição, cliente, valor, vencimento/recebimento, estado, categoria/conta, manual/origem, marca crédito |
| Conta a pagar | fornecedor/evento/categoria, valor, datas/estado/conta, origem/chave, automática, previsto e efetivação |
| Contratação/baixa equipe | profissional/função, snapshots, conta, aplicações, origem, tipo, data, ativo, fonte de crédito |
| Recorrente/competência | modelo, natureza/tipo, valor/dia/vigência, vínculo do salário, competência, ajustes, pagamentos e créditos |
| Espelho provedor | tenant/ambiente, evento/parcela, cobrança/grupo/link, bruto/líquido/taxa, status, reconciliação e referência de pagamento |
| Ajuste/retirada/auditoria | tipo, data/valor/conta, motivo, origem, responsável, antes/depois/compensação |

Valores persistidos em centavos/decimal exato. Tenha chaves únicas para origem automática, pagamento externo, request_uid e referência de aplicação que exigirem retry. Índices compostos e FKs lógicas sempre incluem tenant/owner pertinente. Locks de crédito seguem fonte → obrigação → aplicação; todo consumidor disputa a mesma fonte. DDL fica fora da transação financeira.

## Serviços e APIs do alvo

Separe comandos de leitura/projeção. Estabeleça serviços para registrar/desfazer pagamento, conceder desconto, reagendar, marcar/applicar/desfazer crédito, cadastrar/pagar conta, aplicar baixa/adiantamento, pagar/desfazer salário, efetivar álbum, sync provedor, cancelar pendências, editar vínculo bancário, agregar caixa/DRE/previsão e exportar.

DTO de consulta deve declarar filtros, bases de tempo, totais do filtro completo, linhas e metadados de conciliação. Resultado de comando traz IDs afetados, estado/saldo atualizado e avisos de integração. Erros diferenciam campo inválido, sem permissão, ownership, conflito de estado/saldo e indisponibilidade externa; não devolver SQL/segredos.

No Memora há `ok` e `success` conforme endpoint. O alvo pode padronizar envelope sem mudar o comportamento. Idempotência de comandos protege duplo clique/retry; webhook mantém identidade externa e tolera ordem invertida. Integração após commit precisa de estado de reconciliação; para cancelamento, resolver remoto antes da confirmação local. Timeout após mutação exige consulta antes de repetir cegamente.

## Permissões

| Perfil/ação | Contrato |
|---|---|
| Administração do estúdio | Financeiro empresarial e operações administrativas; respeita tenant, permissões de módulo e ownership. |
| Leitura/export | Mesmos limites em JSON, página, export, job, relatório e IA; UI escondida não é autorização. |
| Crédito cliente, ajuste caixa, reatribuição bancária | Administrativas nos caminhos auditados. |
| Pessoa/freelancer/editor | Somente receitas/obrigações/contas autorizadas do próprio escopo; sem Asaas PJ/saldo global/clientes ou salários de colegas. |
| Salário vinculado | Estúdio configura; beneficiário consulta projeções autorizadas, sem mudar base/ajustes ou criar salário próprio. |

Tenant e usuário vêm da sessão/autorização, nunca do body como autoridade. CSRF/origem para mutação no navegador. Integração privada valida tokens e vínculo real. Scripts administrativos precisam de seleção explícita de tenant e dry-run. Dados entre empresas usam ponte de identidade controlada, não acesso geral por e-mail coincidente.

## Cenários numéricos obrigatórios

O [fixture](../assets/cenarios-reconciliacao.json) contém situações sintéticas independentes e resultados em centavos. Não usa dados de produção. Crie um adaptador que execute cada cenário no alvo e exporte:

```json
{"schema_version": 1, "currency": "BRL", "cases": [{"id": "credito_aplicado", "actual": {"cash_in_cents": 10000, "credit_available_cents": 4000, "installment_outstanding_cents": 0}}]}
```

Essa linha exemplifica o formato; o arquivo real deve conter **todos** os casos. Calcule os valores consultando serviços/banco do alvo depois de operações reais em ambiente isolado; não devolva os valores do fixture por cópia. Cada caso começa com estado limpo, exceto passos declarados no próprio cenário. O script compara as folhas esperadas, aceita campos adicionais e rejeita casos ausentes/duplicados, tipo errado ou valor divergente.

```bash
python scripts/validate_replication.py --actual /caminho/resultados-alvo.json
python scripts/validate_replication.py --check-fixture
python scripts/validate_replication.py --self-test
```

`--check-fixture` e `--self-test` testam recursos da skill; não homologam um alvo. O fixture cobre desconto, crédito/aplicação/estorno, saldo/período/conta, previsto/efetivado, pagamento parcial de equipe/adiantamento, cliente direto, salários/competência, cancelamento, Asaas e diferenças DRE/extrato. Amplie com cenários do segmento do alvo, sem alterar silenciosamente o oracle de paridade.

Os casos `previsao_*` usam meses consecutivos até a âncora especificada; vetor vazio é falta de histórico. Leia o algoritmo de referência em assets para preservar também PRNG/percentis. Compare os valores monetários após arredondar para centavos na mesma fronteira do DTO; confiança e contagem são inteiros, método/nível são labels técnicos.

## Testes de comportamento além dos números

| Família | Verificação necessária |
|---|---|
| Concorrência | Duas aplicações do mesmo crédito; serviço+salário consumindo adiantamento; pagamento simultâneo com cancelamento; dois webhooks; timeout depois de mutação. |
| Isolamento | Dois tenants e duas pessoas com IDs/descrições/documentos coincidentes; troca de tenant/owner no body; export e consulta direta negados. |
| Estado | Cancelado não recebe/reagenda; pago não perde histórico; álbum firme não regride; fonte consumida não muda/exclui; estorno libera apenas a aplicação correta. |
| Espelhos | Deslocamento/extra incluído não duplica; grupo Asaas incompleto não substitui taxa; salário/equipe não criam duas saídas; sync repetido preserva pagos. |
| Tempo | Recebimento fora do mês da festa; competência diferente da baixa; dia 31; fim de ano; ordenação/fuso; avulsa recebida fora do mês do vencimento. |
| UX | Fluxos completos em 320/390 px e desktop; navegação/foco; Ajax; filtro mudado durante request; Carregando/erro/empty; Mostrar mais sem cortar totais. |
| Exports | PDF/CSV/XLSX com filtro inteiro, acentos, datas, negativos, percentuais e escopo; valores perigosos de fórmula de planilha tratados no alvo. |
| Previsão | Zeros, curto/irregular/longo, futuro fora do treino, piso em todos os cenários, determinismo e confiança temporal. |

Estornos de crédito e pagamento não dão permissão de apagar trilha histórica. Não diagnosticar sucesso do provedor por HTTP local nem homologação de produção por fixture offline.

## Migração e fechamento

Mapeie origens duplicadas, parcelas pagas sem log, contas sem banco, espelhos órfãos, saldo de crédito, salários/adiantamentos, períodos e cancelados. Gere relatório sem escrita com somas por tenant/owner/conta/período, pendências e decisões humanas. Não preencher banco/data/cliente por heurística sem evidência.

No apply autorizado, transforme em transações pequenas/idempotentes com snapshot/rollback e autoria. Corrigir valor de contrato não registra pagamento; permuta não vira caixa; ensaio incluso com valor zero não é receita perdida; saque de plataforma não duplica venda paga.

Entregue matriz de paridade, interfaces implementadas, migrações, testes/fixtures do alvo, divergências e estado externo verificado. Exclua pilotos locais da lista de produção confirmada. Atualização desta skill é documentação de replicação, sem nova capacidade no Memora: story/base pública do blog não se aplicam.
