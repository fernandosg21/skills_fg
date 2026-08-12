# Preço, seleção e tracking

## Modos de preço

| Modo | Fórmula | Interface |
|---|---|---|
| unidade | quantidade × valor unitário | mostra unidade e quantidade |
| fechado | valor da opção | oculta multiplicação |

Adicionais avulsos podem ficar fora do valor contratual principal; documente essa decisão e não some silenciosamente.

## Seleção estruturada

Exemplo:

```json
{
  "occasions": [
    {"key":"ceremony","active":true,"date":"...","location":"..."},
    {"key":"party","active":true,"date":"...","location":"..."}
  ],
  "selected_keys":["ceremony_photo","party_photo_video"]
}
```

O servidor mantém o mapa de chaves para ocasião, modalidade e preço.

## Estados distintos

- visualização: abriu ou crawler consultou;
- interesse: clicou e enviou contato mínimo;
- contratação: enviou dados e seleção validada;
- contrato: documento gerado/assinado em fluxo próprio.

Não promova automaticamente um estado usando evidência do anterior.

## Bot versus pessoa

Classifique por user-agent e padrões conhecidos, mas preserve o registro técnico separado. O bot de preview não incrementa métricas humanas nem dispara notificação de primeira abertura.

## Idempotência

Use proposta + versão + código/nonce do envio como chave. Em retry, retorne o mesmo evento/manifestação em vez de criar outro.
