---
name: analyze-private-chat-exports
description: "Implemente ou audite análise de conversas exportadas em TXT com parser de WhatsApp/iOS/Android, estatísticas determinísticas, redação irreversível de PII e credenciais, amostragem cronológica, uma chamada de LLM e persistência apenas dos insights. Use quando resumir conversa por assuntos e tempo, extrair decisões, pendências e próximos passos sem salvar nem enviar o chat cru ao provedor."
---

# Analisar exports privados de conversa

## Objetivo

Transforme um arquivo exportado pelo próprio usuário em relatório útil sem depender de API de histórico, persistir a conversa crua ou enviar nomes e credenciais ao LLM.

## Use a fonte correta

- Aceite o arquivo `.txt` exportado sem mídia pelo usuário.
- Não suponha que API do provedor ou banco local contenha o histórico anterior à integração.
- Limite tamanho, encoding e tempo de processamento.
- Leia [pipeline-de-privacidade.md](references/pipeline-de-privacidade.md).
- Explique ao usuário que anexos/mídia não entram no relatório.

## Parseie formatos reais

- Suporte variações de data/hora, separador e mensagens multilinha de Android e iOS.
- Preserve ordem cronológica e timezone quando inferível.
- Diferencie mensagens de sistema de participantes.
- Calcule período, volume por mês/dia, participantes e lacunas sem IA.
- Marque linhas não reconhecidas em métricas técnicas; não as envie cegamente.

## Aplique proteção em camadas

1. Decodifique e normalize em memória.
2. Descarte inteiramente mensagens que contenham senha, OTP, CVV, token, chave privada ou outra credencial.
3. Substitua telefone, e-mail, CPF/CNPJ, cartão, endereço e outros identificadores por marcadores irreversíveis.
4. Reaplique o scrub na transcrição final como defesa idempotente.
5. Mapeie participantes para papéis genéricos, como Estúdio e Cliente.
6. Remova os nomes reais do corpo antes de chamar o LLM.
7. Nunca grave arquivo nem transcrição bruta.

Mantenha nomes reais somente no parse local temporário para exibição/vínculo autorizado.

## Controle tamanho e cronologia

- Defina teto de caracteres/tokens antes do LLM.
- Para conversa longa, amostre blocos distribuídos ao longo da linha do tempo.
- Preserve início, mudanças de assunto, períodos recentes e mensagens com decisões/pendências.
- Informe no resultado que houve amostragem.
- Não use apenas o começo ou o fim, pois isso distorce evolução e decisões.

## Gere insights estruturados

- Faça uma chamada síncrona por análise, com deadline e fallback do roteador LLM.
- Peça JSON com resumo executivo, assuntos, linha do tempo, decisões, pendências e próximos passos.
- Dimensione tokens de saída para o pior caso do schema; truncamento produz JSON inválido.
- Valide tipos, comprimentos e conteúdo antes de renderizar.
- Faça estatísticas e gráficos virem do parser, nunca do modelo.
- Libere lock de sessão antes da chamada longa e aplique rate limit por usuário/sessão.

## Persista somente o derivado

- Salve metadados não sensíveis, estatísticas e JSON de insights.
- Reconecte ao banco após a chamada longa quando a infraestrutura puder derrubar conexão ociosa.
- Faça persistência best-effort: falha ao salvar não elimina o relatório já gerado.
- Vincule a cliente automaticamente somente por correspondência exata e única; em ambiguidade, deixe sem vínculo.
- Ofereça vínculo manual por autocomplete tenant-scoped e exclusão do resultado.

## Entregue a interface

- Separe abas Analisar e Análises salvas.
- Mostre KPIs determinísticos, gráfico temporal e listas de assuntos/decisões/pendências.
- Avise sobre amostragem e sobre a proteção aplicada.
- Submeta e atualize via Ajax sem perder o arquivo selecionado em erro de validação.
- Nunca inclua texto cru em HTML oculto, atributos, logs ou respostas de erro.

## Valide

- Use fixtures Android/iOS, multilinha, anexos omitidos e caracteres variados.
- Injete telefone, e-mail, documento, OTP, senha, Pix e cartão e prove que não chegam ao payload LLM.
- Prove que mensagens de credencial são descartadas por inteiro.
- Teste conversa longa e cobertura cronológica da amostra.
- Teste JSON truncado, fallback e timeout.
- Teste save/list/get/link/unlink/delete com tenant fictício e limpeza.
- Teste dois clientes de mesmo nome e confirme ausência de auto-vínculo.

## Critérios de conclusão

Considere pronto quando o payload enviado ao provedor contém apenas papéis e texto scrubbed, a conversa crua nunca toca disco/banco e o relatório continua útil mesmo se a persistência falhar.
