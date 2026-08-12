# Pipeline de privacidade

## Ordem obrigatória

```text
upload temporário do request
-> decode/parse em memória
-> descarte de credenciais
-> scrub de PII
-> pseudônimos de papéis
-> bounding/amostragem cronológica
-> chamada LLM
-> validação do insight
-> persistência somente do derivado
```

Apague qualquer temporário criado pelo servidor no `finally`.

## Mensagens para descartar por inteiro

- senha ou senha provisória;
- código OTP/2FA;
- CVV ou dados completos de cartão;
- token/chave de API;
- chave privada/seed;
- credencial de banco/servidor.

Substituir apenas o número pode deixar contexto suficiente para reconstruir o segredo; descarte a mensagem inteira.

## PII para substituir

- nomes dos participantes;
- telefone/e-mail;
- CPF/CNPJ e outros documentos;
- endereço/CEP;
- conta/cartão/chave Pix;
- links privados e tokens.

## Persistência permitida

- período e contagens;
- indicador de amostragem;
- participantes por papel/contagem, sem nomes no insight;
- resumo, assuntos, decisões, pendências e próximos passos validados;
- vínculo opcional a cliente por ID interno;
- modelo/provider/uso sem prompt bruto.

## Amostragem

Divida a conversa em blocos temporais e retire uma cota de cada bloco, reservando espaço extra para trechos recentes e mensagens com verbos de decisão/compromisso. Marque a cobertura aproximada no relatório.
