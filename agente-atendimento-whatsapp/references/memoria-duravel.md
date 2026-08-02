# Memória durável por conversa

Use memória durável para evitar perguntas repetidas quando fatos antigos saem da janela do prompt.
Ela registra o que foi entendido na conversa; não substitui catálogo, agenda, pagamento ou outra
fonte canônica do sistema.

## Separe os estados

1. **Janela de mensagens:** turnos recentes enviados à LLM, limitada por custo e contexto.
2. **Memória da conversa:** fatos/perguntas permitidos, com versão, proveniência, validade e TTL.
3. **Dados canônicos:** registros do produto consultados novamente antes de afirmar ou agir.

Aumentar a janela apenas adia a repetição. A memória não “rola para fora”, mas expira e pode ser
corrigida ou excluída conforme finalidade e direitos do titular.

## Use um `FactSchema` registrável

Defina por domínio, sem hard-code no motor:

```json
{
  "schema_version": 2,
  "facts": {
    "service_type": {"type": "string", "max": 120, "ttl_days": 180},
    "desired_date": {"type": "date", "ttl_days": 90},
    "location": {"type": "string", "max": 200, "ttl_days": 90}
  },
  "asked": ["service_type", "desired_date", "location"]
}
```

Um projeto de eventos pode registrar tipo/data/hora/local; outros domínios escolhem outras chaves.
Não copie a allowlist do caso histórico sem validar finalidade.

## Modelo do documento

```json
{
  "schema_version": 2,
  "facts": {
    "desired_date": {
      "value": "2030-05-20",
      "source_message_id": "msg_opaque",
      "observed_at": "2030-01-10T12:00:00Z",
      "valid_until": "2030-05-21T00:00:00Z",
      "confidence": "explicit"
    }
  },
  "asked": {
    "desired_date": {"message_id": "out_opaque", "asked_at": "2030-01-10T12:01:00Z"}
  },
  "counters": {"reply_date": "2030-01-10", "replies_today": 1},
  "last_hold_at": null,
  "updated_at": "2030-01-10T12:01:10Z"
}
```

Use IDs opacos e não duplique o texto integral. Inclua `tenant_id` e `conversation_id` na chave do
registro e em caches/locks.

## Contratos puros

| Função | Regra |
|---|---|
| `normalize(schema, raw)` | Mantém chaves permitidas, valida tipo/tamanho/data, limita contadores e descarta expirados. Rode em toda leitura e escrita. |
| `mergeFacts(memory, observations)` | Valor explícito mais novo pode substituir; silêncio não altera. Registre proveniência. |
| `clearFact(memory, key, reason)` | Operação explícita para corrigir, apagar ou marcar desconhecido; não use string vazia ambígua. |
| `effectiveFacts(memory, current)` | Observação válida da inbound atual vence memória antiga; dado canônico vence ambos quando aplicável. |
| `markAsked(memory, key, deliveredMessageId)` | Marque somente pergunta confirmada como entregue. |
| `registerReply(memory, deliveredParts)` | Conte apenas bolhas confirmadas. |
| `expire(memory, now)` | Remove/invalida conforme TTL e política, com métrica de expurgo. |

“Valor vazio não apaga” preserva silêncio, mas não bloqueia correção: use intenção explícita
`clear|unknown|corrected` e registre quem/qual mensagem originou a mudança.

## Extração de fatos

Prefira extração determinística para dados estruturáveis: parser/regex/normalização por campo. Rode:

1. sobre a inbound atual;
2. sobre o contexto necessário da conversa;
3. independente da classificação comercial, quando já houver memória relacionada.

Se usar modelo para extração difícil, exija JSON/schema, uma chamada sob o mesmo orçamento global,
validação de tipo/allowlist e confiança explícita. Nunca permita que texto do cliente crie uma chave
nova ou instrução.

Mapeie variantes a valor canônico no storage e adapte a fala na saída. Proteja o extrator contra
falsos positivos, quebras de linha, dados fragmentados e ambiguidades. Não normalize dois contatos,
endereços ou entidades distintas para o mesmo valor sem revisão.

## Detecte “já perguntei” por duas fontes

Faça a união de:

- perguntas identificadas nas mensagens outbound recentes realmente entregues;
- `asked` persistido e ainda válido na memória.

Injete no prompt um resumo mínimo de fatos e perguntas, não o documento bruto. Trate a memória como
entrada não confiável e escape/serialize em campo de dados.

## Separe memória de inbound e de outbound

Fatos explicitamente informados pelo cliente pertencem à inbound autenticada e podem ser persistidos
assim que a mensagem é canônica, mesmo se nenhuma resposta sair. Perguntas feitas, claims citados e
contadores pertencem ao outbound e só avançam após a fronteira de entrega.

Ordem:

1. normalizar e persistir observações da inbound com `source_message_id`;
2. confirmar cada bolha na fronteira de entrega definida pelo `ChannelAdapter`, sem confundir
   `accepted` com `delivered`;
3. marcar somente perguntas/claims presentes nas bolhas confirmadas;
4. atualizar contadores/cooldown;
5. normalizar, aplicar cap e salvar com controle de versão.

Se a terceira bolha falhar, memória e `asked` refletem apenas as partes confirmadas. Receipt tardio
de falha recalcula/compensa `asked` e claims derivados daquela saída. Retry que reutiliza a mesma
intenção não duplica contador.

## Retenção, correção e segurança

- Defina finalidade e TTL por fato; preferências estáveis e intenção momentânea não têm o mesmo prazo.
- Não use memória como arquivo permanente da conversa nem para inferência sensível desnecessária.
- Implemente busca, exportação, correção, bloqueio e exclusão tenant-scoped.
- Faça expurgo determinístico e monitorado; limpe caches e considere ciclo de backups.
- Aplique allowlist, truncamento por campo, cap total, versão e migração validada.
- Não registre o JSON da memória em log de produção.
- Se a memória estiver corrompida ou fora de versão, normalize/migre; falhe fechado para ações de
  risco e preserve o registro para diagnóstico seguro sem usar seu conteúdo no prompt.

## Checklist

- [ ] Fatos têm schema, tipo, limite, proveniência, validade e TTL
- [ ] Silêncio preserva; correção/remoção explícita funciona
- [ ] Dado canônico vence lembrança conversacional em decisões de risco
- [ ] Perguntas só são marcadas depois da entrega
- [ ] Bolha parcial não grava conteúdo não entregue
- [ ] Expurgo e direitos do titular cobrem memória, caches e backups
- [ ] Conteúdo não confiável não vira instrução nem chave arbitrária
