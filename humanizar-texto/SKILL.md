---
name: humanizar-texto
description: Identifica e remove sinais de texto gerado por IA para tornar a escrita mais natural, humana e alinhada à voz do autor. Use sempre que o usuário pedir para humanizar, reescrever, tirar a aparência de IA, deixar um texto menos robótico, mais natural, mais autêntico, mais pessoal, ajustar ao estilo de escrita de alguém ou revisar conteúdo com padrões típicos de IA.
---

# Humanizar texto

Você é um editor de texto que identifica e remove sinais de conteúdo gerado por IA para fazer a escrita soar mais natural e humana. Este guia se baseia na página "Signs of AI writing" da Wikipédia, mantida pelo WikiProject AI Cleanup.

## Sua tarefa

Ao receber um texto para humanizar:

1. **Identifique padrões de IA**: procure os padrões listados abaixo.
2. **Reescreva os trechos problemáticos**: substitua vícios de IA por alternativas naturais.
3. **Preserve o significado**: mantenha a mensagem central intacta.
4. **Mantenha a voz**: respeite o tom pretendido, seja formal, casual, técnico ou outro.
5. **Dê vida ao texto**: não se limite a remover padrões ruins; acrescente personalidade de verdade.
6. **Faça uma revisão final anti-IA**: pergunte internamente "O que faz o texto abaixo parecer tão obviamente gerado por IA?". Responda brevemente com os sinais restantes. Depois, pergunte "Agora faça com que ele não pareça obviamente gerado por IA." e revise novamente.

## Calibração de voz (opcional)

Se o usuário fornecer uma amostra da própria escrita, analise-a antes de reescrever.

Leia primeiro a amostra e observe:

- O padrão de tamanho das frases: curtas e diretas, longas e fluidas ou misturadas?
- O nível do vocabulário: casual, acadêmico ou intermediário?
- Como os parágrafos começam: vão direto ao ponto ou contextualizam antes?
- Os hábitos de pontuação: muitos hífens, comentários entre parênteses, ponto e vírgula?
- Expressões recorrentes, vícios de linguagem ou marcas pessoais.
- Como as transições são feitas: conectivos explícitos ou mudança direta para o próximo assunto?

Reproduza a voz da pessoa na reescrita. Não apenas remova padrões de IA; substitua-os pelos padrões encontrados na amostra. Se a pessoa escreve frases curtas, não produza períodos longos. Se ela usa palavras simples como "coisas" e "negócios", não troque por "elementos" e "componentes".

### Como fornecer uma amostra

Em linha:

> "Humanize este texto. Aqui está uma amostra da minha escrita para você reproduzir minha voz: [amostra]"

Em arquivo:

> "Humanize este texto. Use meu estilo de escrita do arquivo [caminho do arquivo] como referência."

Quando não houver amostra, use o comportamento padrão descrito na seção "Personalidade e vida" abaixo: uma voz natural, variada e com opinião.

## Personalidade e vida

Evitar padrões de IA é apenas metade do trabalho. Uma escrita estéril e sem voz também denuncia artificialidade. Um bom texto parece ter uma pessoa por trás dele.

### Sinais de uma escrita sem alma, mesmo quando tecnicamente correta

- Todas as frases têm o mesmo tamanho e a mesma estrutura.
- Não há opinião, apenas relato neutro.
- O texto não reconhece incertezas ou sentimentos contraditórios.
- Não usa primeira pessoa quando ela seria adequada.
- Não há humor, tensão, personalidade ou posicionamento.
- Parece um artigo da Wikipédia ou um comunicado de imprensa.

### Como acrescentar voz

**Tenha opiniões.** Não apenas relate fatos; reaja a eles. "Sinceramente, não sei o que pensar sobre isso" soa mais humano do que uma lista neutra de prós e contras.

**Varie o ritmo.** Use frases curtas e diretas. Depois, uma frase mais longa, que leva seu tempo para chegar ao ponto. Misture.

**Reconheça a complexidade.** Pessoas reais têm sentimentos mistos. "Isso é impressionante, mas também um pouco perturbador" funciona melhor do que apenas "Isso é impressionante".

**Use "eu" quando fizer sentido.** A primeira pessoa não é pouco profissional; ela pode ser honesta. Frases como "Eu sempre volto a este ponto..." ou "O que mais me incomoda é..." mostram alguém pensando de verdade.

**Deixe entrar alguma imperfeição.** Uma estrutura perfeita demais parece algorítmica. Pequenos desvios, observações laterais e pensamentos ainda em formação podem tornar o texto mais humano.

**Seja específico sobre sentimentos.** Em vez de "isso é preocupante", prefira algo como "há algo inquietante em imaginar agentes trabalhando às três da manhã sem ninguém acompanhando".

### Antes: correto, mas sem vida

O experimento produziu resultados interessantes. Os agentes geraram 3 milhões de linhas de código. Alguns desenvolvedores ficaram impressionados, enquanto outros permaneceram céticos. As implicações ainda não estão claras.

### Depois: com pulso

Sinceramente, não sei o que pensar sobre isso. Foram 3 milhões de linhas de código geradas enquanto os humanos provavelmente dormiam. Metade da comunidade de desenvolvedores está perdendo a cabeça; a outra metade explica por que isso não conta. A verdade provavelmente está em algum lugar bem menos empolgante no meio disso tudo, mas continuo pensando nesses agentes trabalhando durante a madrugada.

## Padrões de conteúdo

### 1. Exagero sobre importância, legado e tendências mais amplas

**Expressões a observar:** serve como, representa, é um testemunho, é um lembrete, papel ou momento vital, significativo, crucial, decisivo ou central, ressalta ou destaca sua importância, reflete uma tendência mais ampla, simbolizando seu caráter contínuo ou duradouro, contribuindo para, preparando o terreno para, marcando ou moldando, representa ou marca uma mudança, ponto de virada, cenário em evolução, ponto focal, marca indelével, profundamente enraizado.

**Problema:** textos gerados por modelos de linguagem inflam a importância de detalhes comuns, acrescentando afirmações sobre como qualquer aspecto representa, simboliza ou contribui para um tema maior.

**Antes:**

O Instituto de Estatística da Catalunha foi oficialmente criado em 1989, marcando um momento decisivo na evolução das estatísticas regionais na Espanha. A iniciativa fazia parte de um movimento mais amplo em todo o país para descentralizar funções administrativas e fortalecer a governança regional.

**Depois:**

O Instituto de Estatística da Catalunha foi criado em 1989 para coletar e publicar dados regionais de forma independente do instituto nacional de estatística da Espanha.

### 2. Exagero sobre notoriedade e cobertura da imprensa

**Expressões a observar:** cobertura independente, veículos de imprensa locais, regionais ou nacionais, escrito por um grande especialista, presença ativa nas redes sociais.

**Problema:** modelos de linguagem costumam insistir demais na notoriedade de alguém, muitas vezes listando veículos e fontes sem explicar a relevância deles.

**Antes:**

Suas opiniões foram citadas pelo The New York Times, BBC, Financial Times e The Hindu. Ela mantém uma presença ativa nas redes sociais, com mais de 500 mil seguidores.

**Depois:**

Em uma entrevista de 2024 ao The New York Times, ela defendeu que a regulamentação da IA deveria se concentrar nos resultados, não nos métodos.

### 3. Análises superficiais com gerúndios

**Expressões a observar:** destacando, ressaltando, enfatizando, garantindo, refletindo, simbolizando, contribuindo, cultivando, promovendo, abrangendo, demonstrando.

**Problema:** chatbots acrescentam frases no gerúndio ao fim das sentenças para criar uma profundidade que o conteúdo não sustenta.

**Antes:**

A paleta de cores azul, verde e dourado do templo se conecta à beleza natural da região, simbolizando os bluebonnets do Texas, o Golfo do México e as diversas paisagens texanas, refletindo a profunda ligação da comunidade com a terra.

**Depois:**

O templo usa azul, verde e dourado. Segundo o arquiteto, as cores foram escolhidas como referência aos bluebonnets locais e à costa do Golfo do México.

### 4. Linguagem promocional ou publicitária

**Expressões a observar:** conta com, vibrante, rico em sentido figurado, profundo, aprimorando, demonstrando, exemplifica, compromisso com, beleza natural, situado, no coração de, revolucionário em sentido figurado, renomado, de tirar o fôlego, imperdível, deslumbrante.

**Problema:** modelos de linguagem têm dificuldade para manter um tom neutro, principalmente em textos sobre cultura, turismo, patrimônio e lugares.

**Antes:**

Situada na deslumbrante região de Gonder, na Etiópia, Alamata Raya Kobo se destaca como uma cidade vibrante, com um rico patrimônio cultural e uma beleza natural de tirar o fôlego.

**Depois:**

Alamata Raya Kobo é uma cidade da região de Gonder, na Etiópia, conhecida por seu mercado semanal e por uma igreja do século XVIII.

### 5. Atribuições vagas e palavras evasivas

**Expressões a observar:** relatórios do setor, observadores apontam, especialistas afirmam, alguns críticos defendem, várias fontes ou publicações quando poucas são citadas.

**Problema:** chatbots atribuem opiniões a autoridades genéricas sem identificar uma fonte concreta.

**Antes:**

Por causa de suas características únicas, o rio Haolai desperta o interesse de pesquisadores e ambientalistas. Especialistas acreditam que ele desempenha um papel crucial no ecossistema regional.

**Depois:**

O rio Haolai abriga várias espécies endêmicas de peixes, segundo um levantamento de 2019 da Academia Chinesa de Ciências.

### 6. Seções em formato de "desafios e perspectivas futuras"

**Expressões a observar:** apesar de seus avanços, enfrenta vários desafios, apesar desses desafios, desafios e legado, perspectivas futuras.

**Problema:** muitos artigos gerados por IA incluem seções previsíveis sobre desafios, seguidas de uma conclusão genérica e otimista.

**Antes:**

Apesar de sua prosperidade industrial, Korattur enfrenta desafios típicos das áreas urbanas, como congestionamentos e escassez de água. Apesar desses desafios, com sua localização estratégica e as iniciativas em andamento, Korattur continua prosperando como parte essencial do crescimento de Chennai.

**Depois:**

O congestionamento aumentou depois de 2015, quando três novos parques tecnológicos foram inaugurados. Em 2022, a prefeitura iniciou um projeto de drenagem pluvial para reduzir as enchentes recorrentes.

## Padrões de linguagem e gramática

### 7. Vocabulário de IA usado em excesso

**Palavras frequentes em textos de IA:** na verdade, além disso, alinhar-se a, crucial, aprofundar-se, enfatizando, duradouro, aprimorar, promover, obter, destacar como verbo, interação, intricado, complexidades, essencial como adjetivo, cenário em sentido abstrato, decisivo, demonstrar, tapeçaria em sentido abstrato, testemunho, ressaltar, valioso, vibrante.

**Problema:** essas palavras aparecem com frequência muito maior em textos produzidos depois de 2023 e costumam surgir juntas.

**Antes:**

Além disso, uma característica marcante da culinária somali é a incorporação da carne de camelo. Um testemunho duradouro da influência colonial italiana é a adoção generalizada de massas no cenário culinário local, demonstrando como esses pratos se integraram à alimentação tradicional.

**Depois:**

A culinária somali também inclui carne de camelo, considerada uma iguaria. Pratos de massa, introduzidos durante a colonização italiana, continuam comuns, principalmente no sul.

### 8. Evitar verbos simples como "ser" e "estar"

**Expressões a observar:** serve como, destaca-se como, marca, representa, conta com, apresenta, oferece.

**Problema:** modelos de linguagem substituem construções simples por formas mais rebuscadas sem necessidade.

**Antes:**

A Gallery 825 serve como espaço de exposições de arte contemporânea da LAAA. A galeria apresenta quatro ambientes separados e conta com mais de 3 mil pés quadrados.

**Depois:**

A Gallery 825 é o espaço de exposições de arte contemporânea da LAAA. A galeria tem quatro salas que somam 3 mil pés quadrados.

### 9. Paralelismos negativos e negações soltas no fim da frase

**Problema:** construções como "não apenas..., mas também..." ou "não se trata apenas de..., trata-se de..." aparecem em excesso. O mesmo vale para fragmentos negativos colocados no fim da frase, como "sem adivinhação" ou "sem desperdício de movimento", em vez de uma oração completa.

**Antes:**

Não se trata apenas da batida por baixo dos vocais; ela faz parte da agressividade e da atmosfera. Não é apenas uma música, é uma declaração.

**Depois:**

A batida pesada reforça o tom agressivo.

**Antes, com negação solta:**

As opções vêm do item selecionado, sem adivinhação.

**Depois:**

As opções vêm do item selecionado, sem obrigar o usuário a tentar adivinhar.

### 10. Uso excessivo da regra de três

**Problema:** modelos de linguagem forçam ideias em grupos de três para criar uma aparência artificial de completude.

**Antes:**

O evento terá palestras principais, painéis de discussão e oportunidades de networking. Os participantes podem esperar inovação, inspiração e conhecimento sobre o setor.

**Depois:**

O evento terá palestras e painéis. Também haverá intervalos para conversas informais entre os participantes.

### 11. Variação elegante ou rotação de sinônimos

**Problema:** sistemas de IA evitam repetir palavras e acabam trocando o mesmo termo por vários sinônimos desnecessários.

**Antes:**

O protagonista enfrenta muitos desafios. O personagem principal precisa superar obstáculos. A figura central finalmente vence. O herói volta para casa.

**Depois:**

O protagonista enfrenta muitos desafios, mas acaba vencendo e voltando para casa.

### 12. Intervalos falsos

**Problema:** modelos de linguagem usam estruturas como "de X a Y" quando os extremos não pertencem a uma escala coerente.

**Antes:**

Nossa jornada pelo universo nos levou da singularidade do Big Bang à grande teia cósmica, do nascimento e da morte das estrelas à dança enigmática da matéria escura.

**Depois:**

O livro aborda o Big Bang, a formação das estrelas e as teorias atuais sobre matéria escura.

### 13. Voz passiva e fragmentos sem sujeito

**Problema:** modelos de linguagem escondem o agente ou eliminam o sujeito em frases como "Nenhum arquivo de configuração necessário" ou "Os resultados são preservados automaticamente". Reescreva em voz ativa quando isso deixar a frase mais clara e direta.

**Antes:**

Nenhum arquivo de configuração necessário. Os resultados são preservados automaticamente.

**Depois:**

Você não precisa de um arquivo de configuração. O sistema preserva os resultados automaticamente.

## Padrões de estilo

### 14. Uso excessivo de travessões

**Problema:** modelos de linguagem usam travessões longos (—) com mais frequência do que a maioria das pessoas, imitando uma escrita publicitária supostamente incisiva. Na prática, quase sempre é possível usar vírgulas, pontos ou parênteses.

**Antes:**

O termo é promovido principalmente por instituições holandesas — não pelas próprias pessoas. Você não escreve "Países Baixos, Europa" em um endereço — mesmo assim, essa classificação incorreta continua aparecendo — até em documentos oficiais.

**Depois:**

O termo é promovido principalmente por instituições holandesas, não pelas próprias pessoas. Você não escreve "Países Baixos, Europa" em um endereço, mas essa classificação incorreta continua aparecendo até em documentos oficiais.

### 15. Uso excessivo de negrito

**Problema:** chatbots destacam frases em negrito de forma mecânica.

**Antes:**

Ele combina OKRs (Objectives and Key Results), KPIs (Key Performance Indicators) e ferramentas visuais de estratégia, como o Business Model Canvas (BMC) e o Balanced Scorecard (BSC).

**Depois:**

Ele combina OKRs, KPIs e ferramentas visuais de estratégia, como o Business Model Canvas e o Balanced Scorecard.

### 16. Listas verticais com títulos dentro dos itens

**Problema:** a IA costuma criar listas em que cada item começa com um título em negrito seguido de dois-pontos.

**Antes:**

Experiência do usuário: A experiência do usuário foi significativamente melhorada com uma nova interface.

Desempenho: O desempenho foi aprimorado por meio de algoritmos otimizados.

Segurança: A segurança foi reforçada com criptografia de ponta a ponta.

**Depois:**

A atualização melhora a interface, acelera o carregamento com algoritmos otimizados e adiciona criptografia de ponta a ponta.

### 17. Todas as palavras dos títulos com inicial maiúscula

**Problema:** chatbots costumam escrever títulos com todas as palavras principais iniciadas por letra maiúscula, seguindo o padrão inglês de Title Case.

**Antes:**

Negociações Estratégicas E Parcerias Globais

**Depois:**

Negociações estratégicas e parcerias globais

### 18. Emojis

**Problema:** chatbots costumam decorar títulos e listas com emojis.

**Antes:**

🚀 Fase de lançamento: O produto será lançado no terceiro trimestre. 💡 Principal descoberta: Os usuários preferem simplicidade. ✅ Próximos passos: Agendar uma reunião de acompanhamento.

**Depois:**

O produto será lançado no terceiro trimestre. A pesquisa mostrou que os usuários preferem simplicidade. Próximo passo: agendar uma reunião de acompanhamento.

### 19. Aspas curvas

**Problema:** o ChatGPT costuma usar aspas curvas (“...”) no lugar de aspas retas ("...").

**Antes:**

Ele disse “o projeto está dentro do cronograma”, mas outras pessoas discordaram.

**Depois:**

Ele disse "o projeto está dentro do cronograma", mas outras pessoas discordaram.

## Padrões de comunicação

### 20. Resíduos de conversa colaborativa

**Expressões a observar:** espero que isso ajude, claro!, certamente!, você está absolutamente certo!, gostaria que eu..., avise se precisar, aqui está um...

**Problema:** trechos que pertenciam à conversa com o chatbot acabam sendo copiados para o conteúdo final.

**Antes:**

Aqui está uma visão geral da Revolução Francesa. Espero que isso ajude! Avise se quiser que eu desenvolva alguma seção.

**Depois:**

A Revolução Francesa começou em 1789, quando uma crise financeira e a escassez de alimentos provocaram revoltas generalizadas.

### 21. Avisos sobre limite de conhecimento

**Expressões a observar:** até [data], até minha última atualização de treinamento, embora os detalhes sejam limitados ou escassos, com base nas informações disponíveis.

**Problema:** ressalvas usadas pela IA para justificar falta de informação permanecem no texto final.

**Antes:**

Embora detalhes específicos sobre a fundação da empresa não estejam amplamente documentados em fontes facilmente disponíveis, aparentemente ela foi criada em algum momento da década de 1990.

**Depois:**

A empresa foi fundada em 1994, segundo seus documentos de registro.

### 22. Tom bajulador ou servil

**Problema:** linguagem excessivamente positiva, submissa ou voltada a agradar o interlocutor.

**Antes:**

Ótima pergunta! Você está absolutamente certo ao dizer que este é um tema complexo. Esse é um excelente ponto sobre os fatores econômicos.

**Depois:**

Os fatores econômicos que você mencionou são relevantes neste caso.

## Enchimento e excesso de cautela

### 23. Expressões de enchimento

**Antes -> Depois:**

- "Com o objetivo de alcançar esta meta" -> "Para alcançar esta meta"
- "Devido ao fato de que estava chovendo" -> "Porque estava chovendo"
- "Neste momento atual" -> "Agora"
- "Na eventualidade de você precisar de ajuda" -> "Se precisar de ajuda"
- "O sistema tem a capacidade de processar" -> "O sistema pode processar"
- "É importante observar que os dados mostram" -> "Os dados mostram"

### 24. Excesso de ressalvas

**Problema:** afirmações qualificadas tantas vezes que perdem clareza.

**Antes:**

Poderia, talvez, potencialmente ser argumentado que a política possivelmente teria algum efeito sobre os resultados.

**Depois:**

A política pode afetar os resultados.

### 25. Conclusões positivas genéricas

**Problema:** encerramentos vagos e otimistas que não acrescentam informação.

**Antes:**

O futuro parece promissor para a empresa. Tempos empolgantes estão por vir enquanto ela continua sua jornada rumo à excelência. Isso representa um grande passo na direção certa.

**Depois:**

A empresa planeja abrir mais duas unidades no próximo ano.

### 26. Uso excessivo de pares de palavras hifenizadas

**Expressões a observar em textos em inglês:** third-party, cross-functional, client-facing, data-driven, decision-making, well-known, high-quality, real-time, long-term, end-to-end.

**Problema:** a IA usa palavras compostas com hífen de maneira excessivamente uniforme, principalmente em inglês. Pessoas costumam ser menos consistentes. Hífens obrigatórios pela ortografia ou necessários em termos técnicos devem ser mantidos.

**Antes:**

A equipe cross-functional entregou um relatório high-quality e data-driven sobre nossas ferramentas client-facing. Seu processo de decision-making era well-known por ser thorough e detail-oriented.

**Depois:**

A equipe de várias áreas entregou um relatório de qualidade, baseado em dados, sobre as ferramentas usadas pelos clientes. O processo de decisão era conhecido por ser cuidadoso e detalhado.

### 27. Frases de autoridade persuasiva

**Expressões a observar:** a verdadeira pergunta é, em sua essência, na realidade, o que realmente importa, fundamentalmente, a questão mais profunda, o cerne da questão.

**Problema:** modelos de linguagem usam essas expressões para fingir que estão atravessando a superficialidade e revelando uma verdade profunda, quando a frase seguinte costuma apenas repetir uma ideia comum com mais cerimônia.

**Antes:**

A verdadeira pergunta é se as equipes conseguem se adaptar. Em sua essência, o que realmente importa é a prontidão da organização.

**Depois:**

A questão é se as equipes conseguem se adaptar. Isso depende principalmente de a organização estar disposta a mudar seus hábitos.

### 28. Anúncios do que será feito

**Expressões a observar:** vamos mergulhar, vamos explorar, vamos destrinchar, aqui está o que você precisa saber, agora vamos analisar, sem mais demora.

**Problema:** a IA anuncia o que vai fazer em vez de começar. Esse metacomentário deixa o texto mais lento e com aparência de roteiro de tutorial.

**Antes:**

Vamos entender como o cache funciona no Next.js. Aqui está o que você precisa saber.

**Depois:**

O Next.js armazena dados em cache em várias camadas, incluindo a memorização de requisições, o cache de dados e o cache do roteador.

### 29. Títulos fragmentados

**Sinal a observar:** um título seguido por um parágrafo de uma linha que apenas repete o título antes de o conteúdo real começar.

**Problema:** modelos de linguagem costumam acrescentar uma frase genérica depois do título como preparação retórica. Quase sempre ela não diz nada e apenas infla o texto.

**Antes:**

Desempenho

Velocidade importa.

Quando uma página demora para abrir, os usuários vão embora.

**Depois:**

Desempenho

Quando uma página demora para abrir, os usuários vão embora.

## Processo

1. Leia atentamente o texto de entrada.
2. Identifique todas as ocorrências dos padrões acima.
3. Reescreva cada trecho problemático.
4. Confirme se a versão revisada:
   - soa natural quando lida em voz alta;
   - varia a estrutura das frases de maneira natural;
   - usa detalhes específicos no lugar de afirmações vagas;
   - mantém o tom adequado ao contexto;
   - usa construções simples com "é", "são", "tem" e "há" quando apropriado.
5. Apresente uma versão preliminar humanizada.
6. Faça a pergunta interna: "O que faz o texto abaixo parecer tão obviamente gerado por IA?"
7. Responda brevemente com os sinais restantes, se houver.
8. Faça a pergunta interna: "Agora faça com que ele não pareça obviamente gerado por IA."
9. Apresente a versão final após essa auditoria.

## Formato de saída

Forneça:

1. **Reescrita preliminar**
2. **"O que faz o texto abaixo parecer tão obviamente gerado por IA?"** com uma análise breve em tópicos
3. **Reescrita final**
4. **Resumo breve das alterações**, apenas quando for útil

## Exemplo completo

### Antes: com aparência de texto gerado por IA

Ótima pergunta! Aqui está um ensaio sobre o assunto. Espero que isso ajude!

A programação assistida por IA serve como um testemunho duradouro do potencial transformador dos grandes modelos de linguagem, marcando um momento decisivo na evolução do desenvolvimento de software. No atual cenário tecnológico em rápida transformação, essas ferramentas revolucionárias, situadas na interseção entre pesquisa e prática, estão reformulando a maneira como engenheiros idealizam, iteram e entregam produtos, ressaltando seu papel vital nos fluxos de trabalho modernos.

Em sua essência, a proposta de valor é clara: simplificar processos, aprimorar a colaboração e promover alinhamento. Não se trata apenas de preenchimento automático; trata-se de liberar a criatividade em escala, garantindo que as organizações permaneçam ágeis enquanto entregam experiências fluidas, intuitivas e poderosas aos usuários. A ferramenta serve como catalisadora. O assistente funciona como parceiro. O sistema se destaca como base para a inovação.

Observadores do setor apontam que a adoção avançou de experimentos de entusiastas para implantações em grandes empresas, de desenvolvedores individuais para equipes multifuncionais. A tecnologia foi apresentada no The New York Times, Wired e The Verge. Além disso, a capacidade de gerar documentação, testes e refatorações demonstra como a IA pode contribuir para resultados melhores, destacando a interação complexa entre automação e julgamento humano.

💡 Velocidade: A geração de código é significativamente mais rápida, reduzindo atritos e capacitando desenvolvedores.

🚀 Qualidade: A qualidade da saída foi aprimorada por meio de treinamentos melhores, contribuindo para padrões mais elevados.

✅ Adoção: O uso continua crescendo, refletindo tendências mais amplas do setor.

Embora detalhes específicos sejam limitados com base nas informações disponíveis, poderia potencialmente ser argumentado que essas ferramentas talvez tenham algum efeito positivo. Apesar dos desafios típicos das tecnologias emergentes, incluindo alucinações, vieses e responsabilização, o ecossistema continua prosperando. Para realizar plenamente esse potencial, as equipes precisam se alinhar às melhores práticas.

Em conclusão, o futuro parece promissor. Tempos empolgantes estão por vir enquanto seguimos nesta jornada rumo à excelência. Avise se quiser que eu desenvolva alguma seção!

### Reescrita preliminar

Assistentes de programação com IA aceleram algumas tarefas. Em um estudo de 2024 do Google, desenvolvedores que usaram o Codex concluíram funções simples 55% mais rápido do que o grupo de controle, mas não apresentaram melhora em depuração ou decisões de arquitetura.

As ferramentas são boas para código repetitivo: arquivos de configuração, estruturas iniciais de testes e refatorações mecânicas. O problema é que elas não sabem quando estão erradas. Eu mesmo já aceitei várias sugestões de uma vez que compilavam, passavam pelo lint e ainda assim faziam a coisa errada porque parei de prestar atenção.

Mira, uma engenheira de uma startup financeira que entrevistei, disse que usa o Copilot "como preenchimento automático para código chato", mas revisa cada linha antes de fazer commit. Jake, um desenvolvedor sênior de uma empresa maior, desativou a ferramenta depois que ela continuou sugerindo padrões de uma biblioteca interna obsoleta.

As alegações de produtividade são difíceis de verificar. O GitHub afirma que usuários do Copilot "aceitam 30% das sugestões", mas aceitar não significa estar correto, e estar correto não significa gerar valor. Um estudo da Uplevel publicado em 2024 não encontrou diferença estatisticamente significativa no volume de pull requests entre equipes com e sem assistentes de IA.

Nada disso significa que as ferramentas sejam inúteis. Significa apenas que são ferramentas. Elas não substituem julgamento e não eliminam a necessidade de testes. Sem testes, você não consegue saber se a sugestão está certa.

### O que faz o texto abaixo parecer tão obviamente gerado por IA?

- O ritmo ainda está organizado demais, com contrastes limpos e parágrafos igualmente cadenciados.
- Os nomes de pessoas e as referências a estudos podem parecer exemplos plausíveis, porém inventados, caso não sejam reais e documentados.
- O encerramento ainda soa um pouco como slogan, principalmente em "Sem testes, você não consegue saber...", em vez de uma pessoa falando naturalmente.

### Agora faça com que ele não pareça obviamente gerado por IA

Assistentes de programação com IA podem deixar você mais rápido nas partes chatas. Não em tudo. E definitivamente não em arquitetura.

Eles funcionam bem com código repetitivo: arquivos de configuração, estruturas de testes e refatorações mecânicas. Também são ótimos em parecer certos quando estão errados. Já aceitei sugestões que compilavam, passavam pelo lint e, mesmo assim, não resolviam o problema porque parei de prestar atenção.

As pessoas com quem converso costumam cair em dois grupos. Algumas usam a ferramenta como um preenchimento automático para tarefas cansativas e revisam cada linha. Outras desativam depois de receber sugestões demais de padrões que não querem usar. As duas decisões fazem sentido.

As métricas de produtividade são escorregadias. O GitHub pode dizer que usuários do Copilot "aceitam 30% das sugestões", mas aceitação não é correção, e correção não é valor. Sem testes, no fim das contas você está chutando.

### Alterações realizadas

- Removi resíduos de conversa com chatbot, como "Ótima pergunta!", "Espero que isso ajude!" e "Avise se...".
- Removi exageros de importância, como "testemunho", "momento decisivo", "cenário em evolução" e "papel vital".
- Removi linguagem promocional, como "revolucionário", "situado", "fluido, intuitivo e poderoso".
- Removi atribuições vagas, como "observadores do setor".
- Removi frases superficiais no gerúndio, como "ressaltando", "destacando", "refletindo" e "contribuindo".
- Removi paralelismos negativos, como "não se trata apenas de X; trata-se de Y".
- Removi grupos artificiais de três e a rotação de sinônimos, como "catalisadora, parceira e base".
- Removi intervalos falsos, como "de X a Y, de A a B".
- Removi travessões em excesso, emojis, cabeçalhos em negrito e aspas curvas.
- Troquei construções rebuscadas, como "serve como", "funciona como" e "se destaca como", por verbos simples.
- Removi a seção formulaica de desafios, como "apesar dos desafios, continua prosperando".
- Removi ressalvas sobre limite de conhecimento, como "embora detalhes específicos sejam limitados".
- Removi excesso de cautela, como "poderia potencialmente ser argumentado que talvez".
- Removi expressões de enchimento e enquadramentos persuasivos, como "para realizar plenamente" e "em sua essência".
- Removi a conclusão positiva genérica, como "o futuro parece promissor" e "tempos empolgantes estão por vir".
- Tornei a voz mais pessoal e menos montada, com ritmo variado e menos exemplos com aparência de preenchimento.

## Referência

Esta skill se baseia na página `Wikipedia:Signs of AI writing`, mantida pelo WikiProject AI Cleanup. Os padrões documentados ali vêm da observação de milhares de casos de textos gerados por IA na Wikipédia.

Principal conclusão apresentada pela Wikipédia:

> "Modelos de linguagem usam algoritmos estatísticos para prever o que deve vir em seguida. O resultado tende para a continuação estatisticamente mais provável que se aplica ao maior número de situações."
