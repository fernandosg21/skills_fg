---
name: integrate-white-label-proof
description: "Implemente ou audite a integração entre um sistema principal e um módulo independente de seleção/prova de fotos, cobrindo modo standalone versus integrado, SSO/vínculo de tenant, clientes e eventos, herança de marca, planos, sincronização de andamento, métricas e falhas recuperáveis. Use quando um portal white-label precisa funcionar sozinho e também conectado ao SaaS sem duplicar contas nem deixar dados órfãos."
---

# Integrar plataforma white-label de prova

## Objetivo

Conecte dois produtos com bancos e ciclos próprios sem fingir que são um monólito. Defina autoridade por campo, IDs externos, sincronização idempotente e comportamento claro quando uma das aplicações estiver indisponível.

## Mapear os dois lados

1. Liste tenants/contas, usuários, clientes, eventos, projetos, planos, marca, métricas e arquivos em cada sistema.
2. Identifique modo standalone, modo integrado e como a transição ocorre.
3. Defina contratos de SSO, API, webhook/outbox e resolução de identidade.
4. Leia [matriz-de-autoridade.md](references/matriz-de-autoridade.md).
5. Preserve contas standalone existentes; não faça merge por e-mail sem prova.

## Modelar vínculo explícito

- Use uma tabela de links com IDs locais e remotos, tenant dos dois lados, estado, versão e timestamps.
- Trate ID remoto como dado não confiável até confirmar ownership.
- Faça unicidade composta impedir dois vínculos ativos contraditórios.
- Nunca selecione por remote_id global com LIMIT 1.
- Registre origem do vínculo e procedimento de desvinculação.

## Separar modos

Standalone:

- identidade, clientes, projetos, billing e marca pertencem ao módulo;
- nenhuma dependência silenciosa do sistema principal;
- links públicos continuam funcionando conforme o próprio contrato.

Integrado:

- o sistema principal fornece somente os domínios declarados;
- o módulo mantém seus dados específicos, como cores de experiência e preferências próprias;
- indisponibilidade do principal degrada com snapshot/cache válido, sem trocar para outra conta.

## Definir autoridade por campo

- Escolha uma fonte para nome do tenant, cliente, evento, plano e logo.
- Use version/updated_at para evitar update antigo sobrescrevendo novo.
- Herança de marca deve ser aplicada em todos os entrypoints públicos e previews, não apenas no painel.
- Não sincronize campos vazios sobre valores válidos sem regra explícita.
- Registre conflito e interrompa mutação quando duas fontes alegarem autoridade.

## Sincronizar clientes e eventos

1. Resolva o tenant integrado.
2. Procure link explícito.
3. Compare identificadores somente dentro daquele tenant como fallback assistido.
4. Crie/atualize o espelho por idempotency key.
5. Persista o link antes de efeitos laterais.
6. Não faça merge destrutivo automático por telefone, documento ou nome.
7. Permita correção manual auditada de vínculo.

## Sincronizar projetos e andamento

- Dê a cada seleção/álbum um external project ID estável.
- Publique estados por eventos versionados: criado, enviado, aberto, selecionado, revisão, aprovado, concluído.
- Faça consumidor idempotente e ignore versões antigas.
- Quando o sistema principal criar uma etapa pós-evento, vincule uma única vez.
- Se o módulo estiver fora, mantenha pendência/outbox e ofereça reconciliação.
- Não marque entrega concluída apenas porque a requisição HTTP retornou 200; valide o estado aceito.

## Integrar plano e entitlement

- Mapeie códigos de plano por tabela explícita, nunca por nome exibido.
- Separe billing do sistema principal de recursos próprios do módulo.
- Aplique limite no backend de ambas as aplicações ou escolha uma autoridade única consultável.
- Preserve acesso de links já emitidos segundo política de downgrade/retenção.
- Diferencie override operacional de cobrança real e mostre essa diferença ao operador.

## Proteger SSO e APIs

- Use tokens curtos, audience/issuer, nonce/state e assinatura forte.
- Não transporte segredo em querystring duradoura.
- Restrinja escopos por operação e tenant.
- Autentique webhooks, deduplique event ID e rejeite replay fora da janela.
- Reduza payloads ao necessário e não logue PII/segredos.

## Medir e reconciliar

- Exponha dashboard e relatórios do módulo a partir de fatos próprios.
- Ao agregar no sistema principal, passe métricas sanitizadas e IDs opacos.
- Tenha job de reconciliação para links órfãos, versões divergentes, outbox presa e planos incompatíveis.
- Alerta de divergência nunca deve corrigir silenciosamente o tenant errado.

## Validar

- Conta standalone permanece funcional sem o sistema principal.
- Integração e desvinculação sem duplicar cliente/projeto.
- Dois tenants com mesmo e-mail, telefone e remote ID aparente.
- Logo alterada no principal refletida em galeria, álbum e preview.
- Evento atualizado fora de ordem.
- Downgrade, override e falha do serviço de plano.
- Replay de webhook e token SSO para audience errada.

## Critérios de conclusão

Considere pronto quando cada domínio tem autoridade declarada, vínculos são tenant-scoped e auditáveis, o módulo continua íntegro nos dois modos e toda sincronização converge após retry sem duplicar projetos ou identidades.
