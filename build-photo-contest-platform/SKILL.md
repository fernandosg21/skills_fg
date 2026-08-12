---
name: build-photo-contest-platform
description: "Implemente ou audite uma plataforma multi-tenant de concurso fotográfico com edições, cadastro, upload protegido, consentimentos separados, avaliação cega por jurados, notas por foto e conjunto, desempate, resultado público, mensagens e retenção. Use quando criar campanha de fotos para famílias, concurso cultural, júri privado ou galeria de vencedores com autorização revogável."
---

# Construir plataforma de concurso fotográfico

## Objetivo

Administre inscrições e julgamento com regras reproduzíveis, imagens protegidas e consentimento de publicação independente da participação ou da chance de vencer.

## Comece por regulamento e privacidade

1. Transforme o regulamento aprovado em regras versionadas e testáveis.
2. Verifique requisitos legais atuais com assessoria/fontes oficiais, especialmente quando houver menores, prêmio ou uso de imagem.
3. Mapeie edição, participante, inscrição/conjunto, envio, jurado, avaliação, premiação e mensagens.
4. Leia [estados-consentimentos-e-notas.md](references/estados-consentimentos-e-notas.md).
5. Não publique uma regra de desempate que contradiga o regulamento aceito.

## Modele edição e inscrição

- Escopo entidades por tenant e use unicidade composta para participante e inscrição.
- Defina rascunho, aberta, em avaliação e concluída com janelas de início/fim no servidor.
- Modele prazos especiais por regra explícita, sem alterar o prazo geral.
- Exija a quantidade exata de fotos e todos os aceites obrigatórios antes de finalizar.
- Separe autorização de publicação como opcional, revogável e desmarcada por padrão.
- Grave versão do regulamento, textos de aceite, data e evidência proporcional.

## Proteja cadastro e uploads

- Use senha com hash, sessão segura, rate limit de login/reset e respostas anti-enumeração.
- Valide arquivo por MIME real, decodificação, dimensões, pixels e tamanho.
- Corrija orientação, recomprima derivados, remova metadados e gere nome aleatório.
- Guarde arquivos fora de acesso HTTP direto; sirva por endpoint que revalida papel, tenant e consentimento.
- Detecte duplicata por hash dentro da edição, com regra especial para substituição atômica.
- Na troca, preserve a foto antiga até a nova estar persistida e commitada; recuse troca após avaliação/premiação.

## Construa avaliação cega

- Autorize somente jurados vinculados à edição.
- Mostre código e material permitido sem nome, e-mail, telefone ou cidade por padrão.
- Revele identidade apenas por ação explícita e auditada quando o regulamento permitir.
- Grave nota e comentário por foto e jurado.
- Calcule nota da foto a partir das avaliações daquela foto.
- Calcule nota do conjunto/família como média das fotos pontuadas, não como média bruta de todas as avaliações.
- Mantenha comentário interno fora de qualquer resposta pública.

## Trate desempate como rodada própria

- Derive candidatas pelo mesmo critério usado na tela e no endpoint.
- Valide no servidor que a foto ainda pertence ao grupo disputado.
- Grave notas de desempate em papel/rodada separados e nunca as inclua na média regular.
- Se o regulamento trata conjunto e a operação deseja foto isolada, altere e comunique o regulamento antes; não esconda a divergência.
- Defina vencedor/premiação de forma atômica para manter a cardinalidade esperada.

## Publique somente o autorizado

- Só mostre resultado após edição concluída e data/hora de publicação alcançada.
- Filtre consentimento no próprio SELECT/serviço de imagem; ocultar botão não basta.
- Revogação deve surtir efeito imediatamente, inclusive em cache; use respostas privadas/no-store.
- Exporte apenas finalistas publicáveis e converta para formato compatível sem alterar o original.
- Separe vencer de autorizar publicação; falta de autorização não pode influenciar nota.

## Envie comunicação fora do upload

- Confirme um lote/inscrição, não uma mensagem por arquivo enviado.
- Faça SMTP após transação curta e mantenha retry se falhar sem invalidar fotos já salvas.
- Não embuta imagem protegida nem URL secreta em e-mail.
- Forneça HTML acessível e versão texto.

## Retenção e validação

- Implemente rotina dry-run por padrão e aplicação explícita para eliminar dados conforme política/regulamento.
- Teste limites de data, quantidade exata, todos os aceites e revogação.
- Teste upload hostil, imagem gigante, duplicata e substituição concorrente.
- Teste cegamento, acesso de jurado alheio e endpoint de imagem montado à mão.
- Teste médias manuais por foto e conjunto, desempate e publicação atrasada.
- Teste e-mail único por lote e falha SMTP.
- Teste dois tenants com o mesmo participante/documento.

## Critérios de conclusão

Considere pronto quando regulamento, código e resultado usam a mesma matemática, identidade permanece oculta durante o julgamento e revogar publicação realmente bloqueia a foto em todas as rotas.
