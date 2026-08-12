---
name: build-public-proposal-flow
description: "Implemente ou audite propostas comerciais públicas para fotografia e eventos com pacotes, cobrança por unidade ou valor fechado, combinações estruturadas, cálculo server-side, validade, rastreamento de abertura, manifestação de interesse, geração de evento/contrato e PDF. Use quando criar proposta para formatura, casamento, aniversário, corporativo, ensaio ou orçamento visual rastreável."
---

# Construir fluxo público de proposta

## Objetivo

Crie uma página compartilhável que calcula opções no servidor, registra interesse real sem confundir robô de preview com cliente e converte a escolha em evento pendente de revisão.

## Audite o domínio existente

1. Mapeie tipos de evento, pacotes, contratos, eventos recebidos, pagamentos e CRM.
2. Preserve nomes/rotas legados usados em links públicos; mude o texto visível sem quebrar identificadores persistidos.
3. Defina modos de preço e combinações válidas.
4. Leia [preco-selecao-e-tracking.md](references/preco-selecao-e-tracking.md).
5. Separe proposta, manifestação de interesse e contrato assinado.

## Modele proposta e opções

- Use token público opaco, tenant resolvido no servidor e estados como rascunho, enviada, fechada, perdida e desativada.
- Suporte preço por unidade e valor fechado.
- No modo unitário, calcule `quantidade × valor_unitário`; no fechado, trate o valor como total.
- Guarde dinheiro em centavos e normalize opções no backend.
- Permita tipos de proposta mapeados para tipos de evento já aceitos pelo restante do sistema.
- Preserve modelos reutilizáveis de pacote sem acoplar proposta antiga a alterações futuras.

## Suporte combinações estruturadas

- Modele ocasiões com chaves estáveis, data, local e modalidades compatíveis.
- Permita no máximo uma modalidade por ocasião e combinação entre ocasiões diferentes.
- Rejeite chaves desconhecidas ou duplicadas no servidor.
- Recalcule subtotais e total a partir do banco; o navegador envia seleção, nunca preço.
- Grave no snapshot contratado ocasiões, datas, locais, itens e subtotais.
- Para proposta legada simples, mantenha o contrato anterior sem exigir a nova estrutura.

## Construa a página pública

- Mostre branding, imagem de topo otimizada, título, opções, adicionais e condições.
- Permita esconder o formulário contratual e manter somente apresentação/interesse.
- Faça a escolha persistente guardar apenas chaves não sensíveis; mantenha PII em memória/session storage ou somente no servidor.
- Ofereça validade, aviso de expiração próxima, desativação e reativação sem apagar dados.
- Gere PDF e impressão a partir do mesmo modelo/normalizador da página.
- Use metatags sociais genéricas e `noindex,nofollow` quando houver conteúdo privado.

## Rastreie abertura com privacidade

- Registre primeira/última abertura, contagem, tipo de dispositivo e identificador pseudonimizado.
- Classifique crawlers de WhatsApp/redes separadamente e não os conte como abertura humana.
- Não armazene IP bruto se um hash rotativo ou outro sinal menos invasivo resolver unicidade aproximada.
- Envie a primeira notificação humana no máximo uma vez.
- Trate tempo por pacote como sinal analítico, não como aceite.

## Converta escolhas com autoridade server-side

1. Resolva proposta pelo token e valide estado/validade.
2. Normalize a seleção e recalcule o total.
3. Registre manifestação de interesse com nome/WhatsApp mínimo e código de verificação.
4. Se o formulário contratual for enviado, valide dados completos e consentimentos.
5. Crie evento/cliente em estado aguardando revisão, idempotente por proposta/aceite.
6. Grave o snapshot do pacote personalizado.
7. Avance a proposta e notifique após commit.
8. Gere contrato somente pelo fluxo de revisão definido; interesse não equivale a assinatura.

## Valide

- Teste modo unitário, fechado, quantidade zero e centavos.
- Teste combinação válida, duas modalidades da mesma ocasião e chave forjada.
- Teste proposta antiga sem estrutura nova.
- Teste crawler social, reload humano e notificação única.
- Teste expiração, desativação, reativação e submissão concorrente.
- Compare total da página, PDF, WhatsApp e snapshot do evento.
- Teste dois tenants e manipulação de token/IDs.

## Critérios de conclusão

Considere pronto quando nenhum preço vem do navegador, cada aceite gera no máximo um evento e métricas distinguem visualização técnica, interesse e contratação.
