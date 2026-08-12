---
name: build-secure-photo-gallery-pwa
description: "Implemente ou audite uma galeria fotográfica privada de entrega com armazenamento de objetos, upload direto pré-assinado, favoritos, convidados, downloads por escopo, ZIP assíncrono, seleção para impressão, expiração, cotas, PWA e retenção. Use quando criar galeria interna white-label, app instalável por evento, entrega de fotos em R2/S3 ou gateway/worker sem acesso ao banco."
---

# Construir galeria fotográfica segura e PWA

## Objetivo

Entregue milhares de fotos com boa experiência móvel, mantendo objetos privados, cotas exatas, downloads autorizados e uma PWA que nunca armazena fotografias offline.

## Divida responsabilidades

1. Mantenha autenticação, tenant, regras, cotas e metadados no aplicativo principal.
2. Guarde originais e derivados persistentes em bucket privado.
3. Envie do navegador ao bucket por URLs pré-assinadas e conclua o asset somente após verificação.
4. Use worker isolado para ZIP e limpeza; não dê acesso direto ao banco.
5. Leia [arquitetura-storage-pwa.md](references/arquitetura-storage-pwa.md).

## Modele ciclo de vida e cotas

- Use estados distintos para rascunho, processamento, publicada, expirada, arquivada e lixeira.
- Somente publicação conclui a entrega digital.
- Expirar/arquivar pode liberar vaga ativa, mas não bytes.
- Retenha lixeira por janela explícita e apague objeto antes de descontar uso/remover registro.
- Conte original, alta sanitizada e miniatura; exclua ZIP temporário se essa for a regra.
- Reserve bytes em transação antes de assinar uploads e expire reservas abandonadas.

## Faça upload direto verificável

1. Valide arquivo e gere derivados sanitizados no cliente ou serviço confiável.
2. Reserve quantidade e bytes no servidor.
3. Gere PUTs assinados restritos a chaves, tamanho, checksum e TTL.
4. Envie original, alta sanitizada e miniatura.
5. Faça HEAD server-side e confira tamanho/checksum.
6. Marque o asset como concluído e converta reserva em uso.
7. Limpe objetos parciais depois do TTL.

Não ofereça fallback silencioso para disco público quando o storage privado falhar.

## Proteja o acesso público

- Use ID público opaco e senha armazenada com hash.
- Mantenha sessão de visitante por galeria e links de convidados revogáveis com escopos próprios.
- Revalide estado, expiração, visitante, qualidade e escopo em cada download.
- Gere URLs de objeto com vida curta e `private, no-store` para fotos e ZIPs.
- Prefira alta sanitizada sem GPS; libere original apenas por escolha explícita.
- Use `noindex,nofollow` e metatags genéricas sem dados do cliente.

## Implemente downloads e worker

- Controle separadamente foto individual, favoritas, seleção de impressão e galeria completa.
- Crie job idempotente de ZIP com prioridade, progresso, erro e expiração.
- Faça o worker reivindicar um job por vez ou por lease, baixar por GET assinado e subir o ZIP por PUT assinado.
- Autentique aplicação e worker com timestamp, nonce/idempotência e HMAC.
- Nunca envie credencial do bucket ou banco ao gateway.
- Expire ZIP rapidamente e limpe-o independentemente da galeria.

## Construa PWA sem cache privado

- Gere manifest e ícone por origem/galeria quando houver identidade personalizada.
- Cacheie somente shell estático e tela offline.
- Nunca cacheie navegação autenticada, respostas de API, fotos, thumbnails ou ZIPs no service worker.
- Mantenha fallback offline explicando que as fotografias exigem conexão.
- Valide instalação real em Android e instrução manual no Safari/iOS.

## Modele favoritas e impressão

- Identifique visitantes sem misturar convidados revogados.
- Faça favoritas idempotentes e tenant/gallery-scoped.
- Congele quantidade, formato, item e pacote no primeiro snapshot contratual.
- Não reduza limite abaixo do vendido ou do total já escolhido.
- Finalizar um grupo gera no máximo um pedido de produção; reabrir exige auditoria.
- Desligar a função preserva snapshot e escolhas.

## Valide

- Teste cota concorrente, upload parcial, checksum errado e reserva expirada.
- Teste senha, convidado revogado, expiração, arquivo e lixeira.
- Teste todos os escopos de download e URL manual fora do escopo.
- Teste ZIP duplicado, worker interrompido, lease vencido e limpeza.
- Inspecione Cache Storage e prove ausência de fotos/APIs.
- Teste dois tenants e IDs públicos inválidos.
- Publique uma galeria sintética e confirme efeitos no pós-evento e na produção.

## Critérios de conclusão

Considere pronto quando nenhum objeto privado depende de obscuridade, bytes reservados reconciliam com o bucket e instalar a PWA não transforma o dispositivo do cliente em cache permanente das fotos.
