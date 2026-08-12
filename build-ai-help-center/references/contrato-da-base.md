# Contrato da base de ajuda

## Estrutura recomendada de cada arquivo

```markdown
---
title: Nome do assunto
keywords: termo 1, termo 2
---

# Nome do assunto

## Onde fica

## Tarefa principal

## Perguntas frequentes

### Como faço tal coisa?
```

## Regras editoriais

- Escrever para quem usa o produto, sem jargão de implementação.
- Uma pergunta por H3, com resposta imediatamente abaixo.
- Explicar restrições visíveis, permissões e diferenças de plano sem inventar números ocultos.
- Não documentar recurso desligado como disponível.
- Não incluir dados reais de clientes nem exemplos sensíveis.
- Preferir passos curtos e nomes exatos da interface.

## Metadados de recuperação

Cada chunk deve preservar:

- escopo;
- arquivo/slug;
- título do documento;
- título da seção/pergunta;
- texto;
- tipo (`guide`, `faq`, `release`);
- peso/ordem.
