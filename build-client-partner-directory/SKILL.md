---
name: build-client-partner-directory
description: "Implemente ou audite um diretório tenant-scoped de parceiros confiáveis para recomendar a clientes, com categorias, contatos, notas internas, perguntas extras de captação, publicação controlada, compartilhamento e histórico de indicações. Use quando criar lista de fornecedores recomendados, guia de parceiros, indicação pós-venda ou quando parceiros comerciais não podem ser confundidos com fornecedores do contas a pagar."
---

# Construir diretório de parceiros para clientes

## Objetivo

Organize indicações úteis ao cliente sem misturar o cadastro comercial do parceiro com fornecedores contábeis, leads comuns ou dados públicos não autorizados.

## Definir as fronteiras

1. Identifique como um contato vira parceiro e quem pode aprová-lo.
2. Separe dados internos, dados compartilháveis e dados financeiros.
3. Defina categorias, critérios de confiança, validade da recomendação e canais de compartilhamento.
4. Leia [modelo-e-governanca.md](references/modelo-e-governanca.md).
5. Mapeie CRM, eventos, formulários públicos e financeiro antes de reutilizar cadastros.

## Modelar parceiro sem duplicar pessoa

- Mantenha uma entidade de parceiro vinculável a um contato/cliente existente, mas com ciclo de vida próprio.
- Escopo tudo por tenant.
- Permita múltiplas categorias por parceiro.
- Separe nome público, contato recomendado, observação interna, nota interna e status de publicação.
- Não use a mesma tabela de fornecedores do contas a pagar como diretório público.
- Preserve histórico quando um parceiro for desativado.

## Controlar publicação

- Publique somente campos allowlisted.
- Exija consentimento ou base contratual adequada para expor telefone, e-mail, imagem ou rede social.
- Não mostre nota interna, motivo de bloqueio, negociação ou dado fiscal.
- Use token ou slug opaco quando a página for compartilhável apenas com clientes.
- Gere preview social genérico, sem PII.
- Permita revogar a publicação imediatamente sem apagar o cadastro interno.

## Integrar ao CRM e à captação

- Ofereça promoção explícita de um contato do CRM para parceiro; não converta automaticamente por texto livre.
- Reaproveite identidade por ID tenant-scoped.
- Permita que formulários façam perguntas extras configuradas pelo tenant, mas salve respostas no contexto correto.
- Valide tipos, obrigatoriedade, opções e limites no backend.
- Não substitua campos canônicos do cliente por respostas de pergunta extra.
- Registre a origem e quem aprovou o parceiro.

## Registrar indicações

1. Resolva cliente/evento e parceiro pelo tenant.
2. Registre instante, canal, contexto e responsável.
3. Use chave idempotente quando a mesma ação puder ser repetida.
4. Não prometa comissão, disponibilidade ou qualidade sem fonte explícita.
5. Se houver comissão, trate-a em contrato/financeiro separado e auditável.

## Entregar busca e compartilhamento úteis

- Filtre por categoria, região, status e texto normalizado.
- Não pré-carregue dados sensíveis desnecessários.
- Permita copiar uma recomendação ou montar lista por evento sem reload completo.
- Mostre claramente que a contratação e responsabilidade pertencem às partes adequadas.
- Faça links externos seguros e sem redirecionamento aberto.

## Governar qualidade

- Registre última revisão e responsável.
- Permita suspender por informação desatualizada ou incidente.
- Diferencie avaliação interna de depoimento público.
- Não calcule ranking público com amostra insuficiente ou regra opaca.
- Defina retenção de leads rejeitados e respostas extras.

## Validar

- Mesmo telefone em parceiros de tenants diferentes.
- Contato já cliente promovido sem duplicar identidade.
- Parceiro desativado ainda preservado no histórico de indicação.
- Campo interno nunca presente em HTML/JSON público.
- Pergunta extra malformada, resposta fora das opções e reenvio.
- Link revogado e acesso cruzado por ID.
- Lista compartilhada no desktop e no celular.

## Critérios de conclusão

Considere pronto quando o diretório mantém fronteiras entre relacionamento, publicidade e contabilidade, publica somente dados autorizados e registra cada indicação sem duplicar pessoas ou expor notas internas.
