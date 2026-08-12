---
name: build-link-in-bio-lead-funnel
description: "Implemente ou audite uma página pública de link na bio com identidade do negócio, blocos e links ordenáveis, formulário de contato, slug seguro, publicação por versão, analytics consentidos e entrada idempotente no CRM. Use quando criar Linktree white-label, página de bio do Instagram, mini-site de captação ou medir visita, clique e conversão sem expor dados pessoais."
---

# Construir funil de link na bio

## Objetivo

Transforme uma página curta de perfil em canal mensurável de aquisição, sem misturar edição e publicação nem criar leads duplicados a cada reenvio.

## Definir o contrato

1. Mapeie identidade visual, links, chamadas, formulário e destino do lead.
2. Separe estado de rascunho da versão publicada.
3. Defina quais métricas exigem consentimento e quais eventos podem ser agregados legitimamente.
4. Leia [modelo-publicacao-e-metricas.md](references/modelo-publicacao-e-metricas.md).
5. Identifique limites do plano e políticas de slug, upload e retenção.

## Modelar perfil e blocos

- Use um perfil tenant-scoped com slug público globalmente único.
- Modele blocos ordenados por tipo, como link, texto, separador, contato, WhatsApp e rede social.
- Valide configuração por schema; não renderize HTML arbitrário salvo com confiança.
- Mantenha IDs estáveis para medir cliques mesmo após reordenar.
- Permita ativar/desativar sem excluir histórico.
- Aplique cotas e tipos permitidos no backend.

## Publicar por versão

- Salve edições em rascunho e publique uma versão imutável ou snapshot coerente.
- Faça a página pública ler somente a versão publicada.
- Registre quem publicou, quando e qual versão substituiu.
- Ofereça preview protegido que não altere métricas públicas.
- Evite que uma edição parcial apareça durante múltiplos saves.

## Proteger slug e identidade

- Normalize slug de forma determinística e bloqueie nomes reservados.
- Resolva colisão sem revelar outro tenant.
- Valide ownership antes de renomear e mantenha redirecionamento temporário apenas se a política permitir.
- Faça upload de logo/capa com MIME real, limites, nome opaco e derivados seguros.
- Use metadados sociais com URLs absolutas, sem dados privados.

## Captar contato no CRM

1. Exija apenas os campos necessários e consentimento quando aplicável.
2. Use honeypot, tempo mínimo, rate limit e validação server-side.
3. Normalize telefone/e-mail e deduplique dentro do tenant.
4. Crie ou reaproveite lead/oportunidade por contrato idempotente.
5. Registre origem, página, campanha e bloco sem enviar PII a pixels.
6. Dispare follow-up somente uma vez.
7. Mostre sucesso genérico e preservado via Ajax.

## Medir sem invadir

- Conte visita, sessão, clique e envio com IDs opacos.
- Não grave IP puro quando um identificador agregado/HMAC rotativo atender.
- Separe bot, preview do proprietário e tráfego real.
- Condicione ferramentas externas à escolha de consentimento.
- Deduplicate conversão por submissão/lead, não por recarregamento da página de sucesso.
- Mantenha métricas internas úteis quando pixels estiverem bloqueados.

## Entregar editor utilizável

- Use drag-and-drop com alternativa por botões e suporte mobile.
- Salve sem reload completo, com estado de loading e erro por bloco.
- Mostre rascunho versus publicado e horário da última publicação.
- Não permita script, URL perigosa, esquema javascript ou redirecionamento aberto.
- Faça a página pública rápida, responsiva, acessível e independente do painel autenticado.

## Validar

- Slugs concorrentes e nomes reservados.
- Rascunho parcialmente salvo sem vazar ao público.
- Link reordenado mantendo identidade e histórico.
- Envio repetido, duplo clique, bot e telefone já existente.
- Dois tenants com o mesmo contato.
- Preview do dono não contaminando métricas.
- Consentimento negado sem chamadas externas.
- XSS em título, URL e parâmetros de campanha.

## Critérios de conclusão

Considere pronto quando edição e publicação são coerentes, o formulário converge no CRM sem duplicação e as métricas distinguem visitas, cliques e leads sem transportar PII para integrações.
