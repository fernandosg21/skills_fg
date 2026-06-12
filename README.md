# skills_fg

Coleção pessoal de skills do Claude Code mantidas por [@fernandosg21](https://github.com/fernandosg21).

Cada subpasta é uma skill independente, instalável copiando para `~/.claude/skills/<nome-da-skill>/` (ou para `.claude/skills/` no diretório do projeto).

## Skills disponíveis

| Skill | Descrição |
|-------|-----------|
| [`contratos-assinatura-digital-br`](./contratos-assinatura-digital-br) | Implementa sistema de contratos com assinatura digital/eletrônica seguindo a legislação brasileira (MP 2.200-2 art. 10 §2º, Lei 14.063/2020): templates DOCX com placeholders, link público por token, evidências forenses e hashes SHA-256 de inviolabilidade. |
| [`create-scroll-video-hero`](./create-scroll-video-hero) | Cria hero section com vídeo controlado pelo scroll (blob preload, decoder unlock, `--hero-progress`). |
| [`implement-asaas-checkout`](./implement-asaas-checkout) | Implementa checkout e cobranças recorrentes com o gateway Asaas. |
| [`onboarding-system`](./onboarding-system) | Implementa um sistema completo de onboarding (tour guiado, modais por módulo, FAB de ajuda, guia em markdown e chatbot local sem IA) em qualquer aplicação web, agnóstico de stack e banco. |
| [`separar-arte-em-camadas-psd`](./separar-arte-em-camadas-psd) | Separa artes achatadas PNG/JPG em camadas rasterizadas e entrega PSD organizado, com fundo limpo, textos, molduras, placeholders, ornamentos, sombras e referência original. Use quando o pedido for transformar uma imagem pronta em template editável no Photoshop. |

## Como instalar uma skill

### Instalação global (todos os projetos)

```bash
# Linux/macOS
cp -r separar-arte-em-camadas-psd ~/.claude/skills/

# Windows (PowerShell)
Copy-Item -Recurse separar-arte-em-camadas-psd $env:USERPROFILE\.claude\skills\
```

### Instalação por projeto

```bash
mkdir -p .claude/skills
cp -r separar-arte-em-camadas-psd .claude/skills/
```

Após copiar, o Claude Code reconhece a skill automaticamente. Verifique com `/help` ou peça algo que dispare a skill.

## Estrutura de uma skill

Cada skill segue o padrão oficial:

```
<skill-name>/
├── SKILL.md          # Frontmatter (name, description) + metodologia principal
├── README.md         # Onde usar, quando acionar e como executar
├── references/       # Documentos auxiliares carregados sob demanda, quando existirem
├── scripts/          # Helpers opcionais de automação, quando existirem
├── examples/         # Configurações ou casos de exemplo, quando existirem
├── prompts/          # Prompts auxiliares, quando existirem
└── checklists/       # Critérios de QA, quando existirem
```

Veja a [documentação oficial de skills](https://docs.claude.com/en/docs/claude-code/skills) para mais detalhes.

## Licença

MIT — sinta-se livre para copiar, modificar e redistribuir.
