---
name: collect-in-app-product-feedback
description: "Implemente ou audite coleta de feedback dentro de aplicações SaaS com formulário Ajax, contexto técnico sanitizado, categorias, anexos opcionais, consentimento para captura, rate limit, deduplicação, triagem, histórico e resposta controlada. Use quando adicionar botão de feedback, relato de bug, sugestão, elogio ou fluxo de voz do cliente sem expor dados do tenant."
---

# Coletar feedback do produto dentro do app

## Objetivo

Reduza o atrito para relatar problemas e sugestões, mas não transforme o formulário em canal de vazamento de dados, envio arbitrário de arquivos ou resposta automática ao cliente.

## Definir o fluxo

1. Liste pontos de entrada, tipos de feedback e equipe responsável.
2. Decida quais dados de contexto ajudam de fato no diagnóstico.
3. Defina estados de triagem, SLA e canal de retorno.
4. Leia [modelo-e-triagem.md](references/modelo-e-triagem.md).
5. Separe feedback de incidente de segurança, suporte urgente e avaliação pública.

## Capturar apenas o necessário

- Peça categoria, descrição e impacto em linguagem simples.
- Resolva tenant e usuário no servidor; não aceite esses IDs como autoridade do payload.
- Capture rota lógica, versão do app, navegador e viewport somente quando úteis.
- Não envie HTML da página, estado global, localStorage, cookies, tokens ou payloads de rede.
- Ofereça opção de contato/resposta conforme a conta e consentimento.
- Alerte para não incluir senha, documento ou dados de clientes.

## Construir formulário Ajax

- Abra modal acessível a partir de botão persistente ou contexto específico.
- Preserve texto em falha recuperável e mostre estado de envio.
- Valide tamanho e campos no backend.
- Use CSRF, autenticação, rate limit por usuário/tenant e nonce de submissão.
- Não recarregue a página inteira após enviar.
- Mostre protocolo opaco e expectativa realista de acompanhamento.

## Tratar screenshots e anexos

- Torne captura opcional e peça confirmação antes de anexar.
- Prefira captura da área da aplicação, nunca da tela inteira do dispositivo.
- Permita recorte/remoção e avise sobre dados visíveis.
- Valide MIME real, tamanho, dimensões e conteúdo básico; gere nome opaco.
- Armazene fora do webroot ou em objeto privado com URL curta assinada.
- Remova metadados EXIF e aplique retenção curta.
- Não faça OCR/IA automaticamente sem finalidade e consentimento definidos.

## Deduplicar sem silenciar

- Use submission nonce para duplo clique/retry.
- Sugira feedback parecido na triagem, mas não faça merge automático por texto.
- Conte ocorrências e preserve tenant/autor de cada relato.
- Mantenha fingerprints técnicos sanitizados para agrupar versão/rota/erro.
- Nunca exponha relatos de outro tenant ao usuário.

## Triar com estados claros

1. Recebido.
2. Em análise.
3. Precisa de informação.
4. Planejado ou em correção.
5. Resolvido.
6. Não será feito ou duplicado, com motivo interno adequado.

Registre toda transição, responsável e nota. Diferencie severidade técnica de prioridade de produto.

## Integrar sem efeitos surpresa

- Criar issue/ticket externo deve ser ação explícita e idempotente.
- Redija PII antes de enviar a terceiros.
- Não publique feedback como depoimento sem autorização separada.
- Notifique a equipe por outbox/digest, evitando uma mensagem por spam.
- Resposta ao usuário parte de operador autorizado e canal registrado.
- Relacione release/story somente quando a correção realmente estiver publicada.

## Medir

- Volume por categoria, módulo, versão e severidade.
- Tempo até primeira triagem e resolução.
- Ocorrências por fingerprint.
- Reabertura e satisfação após resolução.
- Taxa de anexos e rejeição.
- Abuso/rate limit sem coletar conteúdo desnecessário.

Não use quantidade bruta de pedidos como prioridade automática.

## Validar

- Duplo clique, retry e duas abas.
- Payload com tenant/user falsos.
- Texto enorme, HTML/script e segredo conhecido.
- Screenshot com EXIF, MIME falso e arquivo grande.
- Usuário removido depois do envio.
- Operador sem permissão tentando ler anexo.
- Ticket externo com timeout e retry.
- Estado resolvido sem release real.
- Mobile, teclado e leitor de tela.

## Critérios de conclusão

Considere pronto quando o feedback é fácil de enviar, contém contexto suficiente e sanitizado, anexos ficam privados, triagem é auditável e integrações não duplicam nem divulgam relatos sem autorização.
