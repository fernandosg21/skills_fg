# Modelo e governança do diretório

## Entidades

| Entidade | Responsabilidade |
|---|---|
| partner | Perfil tenant-scoped e estado |
| partner_contact_link | Vínculo opcional com contato existente |
| partner_category | Taxonomia do tenant |
| partner_publication | Campos publicados e versão |
| partner_question | Pergunta extra configurada |
| partner_answer | Resposta ligada ao contexto de captação |
| partner_referral | Indicação feita a cliente/evento |
| partner_review | Revisão interna e validade |

## Estados

cadastro:

rascunho -> aprovado -> ativo -> suspenso ou desativado

publicação:

privado -> publicado -> revogado

Revogar publicação não remove histórico nem torna o cadastro contábil.

## Classificação dos campos

| Classe | Exemplos | Pode ir ao público |
|---|---|---:|
| público aprovado | nome comercial, categoria, site | sim |
| contato condicionado | telefone, WhatsApp, Instagram | somente com autorização |
| interno | nota, observação, motivo de suspensão | não |
| fiscal/financeiro | documento, banco, comissão | não |

## Chaves idempotentes

- promoção do CRM: tenant + contact_id;
- resposta de formulário: submission_id + question_id;
- indicação: tenant + contexto + partner_id + action_nonce.

## Perguntas extras

Tipos seguros: texto curto, número limitado, escolha única, múltipla escolha e booleano. Versione a pergunta para que respostas antigas mantenham significado depois de edição.
