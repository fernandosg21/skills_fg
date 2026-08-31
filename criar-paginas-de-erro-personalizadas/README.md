# Skill — Criar Páginas de Erro Personalizadas

Skill reutilizável para criar páginas 401, 403, 404, 408, 410, 413, 422, 429, 500, 502, 503, 504 e estados offline alinhados à identidade visual de qualquer projeto.

## Diferencial

A skill impede o erro comum de gerar a página inteira como uma imagem. Logo, código, título, explicação e botões permanecem em HTML; a arte funciona como camada decorativa responsiva.

## Gate obrigatório

Antes de criar páginas personalizadas, a skill solicita:

- logo oficial;
- identidade visual: manual, cores, fontes, telas aprovadas ou URL;
- projeto/repositório e stack, quando ainda não estiverem disponíveis;
- códigos desejados, quando o usuário não quiser o conjunto padrão.

## Estrutura

```text
criar-paginas-de-erro-personalizadas/
├── SKILL.md
├── agents/openai.yaml
├── references/
│   ├── METAPROMPT.md
│   ├── catalogo-de-erros.md
│   └── qa-e-integracao.md
├── assets/
│   ├── error-page-base.html
│   ├── error-page-base.css
│   └── error-pages.example.json
└── scripts/
    ├── scaffold_error_pages.py
    └── validate_error_package.py
```

## Instalação

Copie a pasta para o diretório de skills aceito pelo agente, por exemplo:

```text
~/.codex/skills/criar-paginas-de-erro-personalizadas/
~/.claude/skills/criar-paginas-de-erro-personalizadas/
```

Também pode ser instalada localmente no projeto conforme a descoberta de skills do agente.

## Uso

Exemplos:

```text
Use $criar-paginas-de-erro-personalizadas para criar um kit 403, 404, 500 e 503 para este projeto.
```

```text
Refatore a página 404 com a identidade da marca e mantenha código, título e botão em HTML.
```

## Assets de apoio

O template neutro em `assets/` serve como scaffold, não como identidade final.

Gere páginas estáticas de demonstração:

```bash
python scripts/scaffold_error_pages.py \
  --manifest assets/error-pages.example.json \
  --template assets/error-page-base.html \
  --output /tmp/error-pages-demo
```

Valide um pacote:

```bash
python scripts/validate_error_package.py /tmp/error-pages-demo
```

## Publicação no catálogo

Use a entrada de `CATALOG-ENTRY.md` no README do repositório `skills_fg`.
