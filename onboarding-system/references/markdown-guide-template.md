# Template do guia em markdown

Este documento define a **estrutura, formatação e tom** do arquivo `ONBOARDING.md` (ou equivalente) que serve simultaneamente:
1. À aba "Guia de uso" do painel de ajuda — renderizado como HTML.
2. Ao chatbot — parseia a seção `## FAQ` para indexar Q&A.

## Regras invioláveis para o parser/chatbot funcionar

1. A seção de FAQ tem o cabeçalho exato `## FAQ` (case-insensitive, mas sem outras palavras).
2. Dentro do FAQ, cada pergunta usa **três hashes** (`### `).
3. A resposta é o conteúdo entre uma pergunta e a próxima `### ` (ou o fim do arquivo / próxima `## `).
4. A seção `## FAQ` deve ser a **última** do arquivo. Qualquer `## ` após ela interrompe o parser.
5. Não use blocos de código, tabelas ou HTML dentro do markdown — o renderer minimalista não suporta. Use apenas:
   - `# `, `## `, `### ` para headings
   - `**bold**`, `*italic*`
   - `[texto](url)` para links
   - `- item` para listas
   - `> citação` para blockquote
   - parágrafos separados por linha em branco

## Estrutura recomendada

```markdown
# Guia de uso do <Produto>

> <Frase de boas-vindas curta, 1 linha>

## Primeiros passos
<Parágrafo explicando o que o produto resolve e como acessar.>

### Como faço o primeiro acesso?
<Passo-a-passo curto com **negrito** nos botões/menus.>

### Como personalizo a aparência?
<Idem.>

## <Módulo 1>

<Parágrafo de propósito do módulo.>

### Como [ação principal]?
<Passo-a-passo.>

### Como [outra ação]?
<Passo-a-passo.>

## <Módulo 2>
...
## <Módulo N>
...

## Configurações
### Como reinicio o tour guiado?
Clique no botão de ajuda (canto inferior direito) e escolha **Reiniciar tour**, ou vá em **Configurações** → **Onboarding** → **Reiniciar tour guiado**.

### Onde encontro este guia novamente?
Clique no botão de ajuda flutuante a qualquer momento e abra a aba **Guia de uso**.

## FAQ

### Pergunta natural do usuário?
Resposta em 1-3 frases. Use **negrito** para destacar botões e menus. Aponte para a navegação concreta: "Vá em **Módulo X** > **Botão Y**".

### Outra pergunta?
Outra resposta.

...
```

## Diretrizes de redação

### Tom
- Acolhedor, mas direto. Sem subestimar o leitor.
- Segunda pessoa ("você abre", "você clica"), nunca primeira pessoa ("eu posso te ajudar").
- Evite jargão técnico interno do time. Use o vocabulário do usuário final.
- Se o produto tem um tom específico (formal, informal, divertido), herde-o. Verifique 3-4 textos do produto antes.

### Tamanho
- Cada seção de módulo: 1 parágrafo de propósito + 2-4 subseções `### Como [ação]`.
- Cada resposta de FAQ: 1-3 frases. Máximo 4. Respostas longas viram cartas que ninguém lê.
- Arquivo total: mire em 200-400 linhas. Mais que isso, considere dividir em múltiplos guias.

### Linkagem interna
- Headings ganham âncoras automáticas se você implementou no renderer.
- Você pode referenciar `[Como cadastrar pacientes](#como-cadastro-um-paciente)` — funciona se o renderer gera IDs slugificados.

### Negrito é semântico
Reserve `**negrito**` para:
- Nomes de botões: "clique em **Salvar**"
- Nomes de menus: "vá em **Configurações**"
- Nomes de páginas/módulos: "abra **Pacientes**"
- Nomes de campos: "preencha **Nome completo**"

Não use negrito para ênfase emocional ("é **muito importante**"). Use *itálico* se precisar de ênfase.

## Lista de perguntas frequentes

Para um SaaS típico, mire em **25-30 perguntas** distribuídas assim:

| Categoria | Perguntas | Notas |
|-----------|-----------|-------|
| Primeiros passos | 2-3 | Acesso, customização inicial, convidar pessoas |
| Cada módulo principal | 2-4 por módulo | Ação principal de criar, editar, remover, exportar |
| Permissões e papéis | 1-2 | Quem vê o quê, como mudar |
| Faturamento (se aplicável) | 2-3 | Plano, fatura, upgrade |
| Integrações (se aplicável) | 1-2 por integração | Como conectar, o que sincroniza |
| Sistema | 2 | Reiniciar tour, encontrar guia |

### Como escrever uma boa pergunta

Use a forma exata que um usuário REAL digita:

✅ **Bons exemplos** (linguagem natural, conjugada em primeira pessoa):
- "Como cadastro um paciente?"
- "Como faço para criar um agendamento?"
- "Onde vejo meu histórico de vendas?"
- "Posso desativar um usuário sem apagar os dados dele?"

❌ **Maus exemplos** (estilo nominal/técnico):
- "Cadastro de paciente" (cabeçalho, não pergunta)
- "Criação de agendamento" (idem)
- "Histórico de vendas" (idem)
- "Desativação de usuário" (idem)

A pergunta natural inclui as palavras-chave que o usuário **realmente digita** no chatbot. O nominal/técnico não.

### Como escrever uma boa resposta

1. **Comece pela ação concreta**: "Vá em...", "Clique em...", "Acesse o menu...".
2. **Use o caminho de navegação completo**: "Em **Pacientes** > **Novo paciente**" é melhor que "No formulário de paciente".
3. **Mencione o resultado esperado** se não for óbvio: "Você verá uma confirmação verde no topo da tela".
4. **Pare**. Não adicione "espero ter ajudado", "se tiver dúvidas...", "também recomendo...". A resposta é a resposta.

**Exemplo bom**:
```
### Como cadastro um paciente?
Vá em **Pacientes** > **Novo paciente**. Preencha nome, telefone e dados básicos e clique em **Salvar**. O paciente aparece na lista imediatamente.
```

**Exemplo ruim** (excesso de palavras, sem caminho):
```
### Como cadastro um paciente?
É super fácil! Nosso sistema permite cadastrar pacientes de várias formas. Você só precisa preencher um formulário com algumas informações e o sistema cuida do resto. Importante notar que campos como nome são obrigatórios.
```

## Distribuição sugerida por tipo de produto

### SaaS de gestão (CRM, ERP, clínicas, escolas)
- 12-15 FAQs sobre os módulos centrais (cadastro, edição, listagem)
- 5-6 FAQs sobre relatórios e exports
- 3-4 FAQs sobre integrações
- 3-4 FAQs sobre permissões/faturamento

### Produtos de produtividade (notes, tasks, projetos)
- 8-10 FAQs sobre criar/organizar conteúdo
- 5-6 FAQs sobre compartilhamento e colaboração
- 4-5 FAQs sobre sincronização e dispositivos
- 3-4 FAQs sobre planos pagos

### Marketplaces / Vendas
- 6-8 FAQs sobre criar/listar produtos
- 6-8 FAQs sobre vendas e pedidos
- 4-5 FAQs sobre pagamentos e taxas
- 4-5 FAQs sobre logística/entregas

## Checklist antes de publicar

- [ ] Arquivo tem `# Título principal` no topo
- [ ] Tem `## FAQ` no final, em última posição
- [ ] FAQ tem 20-30 perguntas
- [ ] Cada pergunta é uma frase natural terminando em `?`
- [ ] Cada resposta tem 1-3 frases
- [ ] Negrito usado em nomes de botões/menus/campos
- [ ] Nenhuma resposta começa com "ALWAYS", "DEVE", "É necessário"
- [ ] Idioma consistente do início ao fim (sem mistura)
- [ ] Sem código (` ``` `), sem tabelas, sem HTML
- [ ] Arquivo entre 200-400 linhas
- [ ] Encoding UTF-8, line endings consistentes (LF preferido para portabilidade)

## Versionamento e manutenção

- O markdown é parte do produto. Versione no repo principal.
- Quando uma feature mudar, atualize a seção correspondente **no mesmo PR**.
- Quando uma nova pergunta aparecer em 2+ tickets de suporte, adicione ao FAQ.
- Bumpe `version` no `OnboardingState` se mudar o tour inicial — assim usuários antigos veem o novo.

## Exemplo mínimo viável (curto para começar)

Se você precisa entregar rápido e iterar depois:

```markdown
# Guia de uso do <Produto>

> Bem-vindo(a)! Este guia te ajuda a tirar o melhor proveito da plataforma.

## Primeiros passos
<1 parágrafo>

## <Módulo principal>
### Como [ação 1]?
<1 parágrafo>

### Como [ação 2]?
<1 parágrafo>

## FAQ

### Como faço o primeiro acesso?
Acesse <url> e faça login com **e-mail e senha**.

### Como cadastro <entidade principal>?
Em **<Módulo>** > **Novo**, preencha os campos obrigatórios e clique em **Salvar**.

### Como reinicio o tour guiado?
Clique no botão de ajuda (canto inferior direito) e escolha **Reiniciar tour**.

### Onde encontro este guia novamente?
Clique no botão de ajuda a qualquer momento e abra a aba **Guia de uso**.

### Como falo com o suporte?
<resposta>
```

5 perguntas é um piso aceitável para entrar em produção. Cresça organicamente conforme dúvidas reais aparecem nos tickets.
