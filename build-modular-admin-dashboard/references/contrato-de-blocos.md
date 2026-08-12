# Contrato de blocos

## Metadados sugeridos

```text
key
label
description
category
icon
default_size
allowed_sizes
available(context) -> bool
renderer
```

## Contexto de render

- tenant e usuário já autenticados.
- papel/capacidades.
- plano/entitlements/módulos efetivos.
- período/fuso quando aplicável.
- serviços compartilhados já carregados.

## Regras do renderer

- Não confiar em `tenant_id` vindo do bloco salvo.
- Não emitir shell da página.
- Ter estado vazio e estado de erro em linguagem do usuário.
- Não fazer mutação no GET.
- Evitar bibliotecas globais desnecessárias.
- Declarar dependências de dados para permitir batch/prefetch.
- Ser responsivo no menor tamanho permitido.
