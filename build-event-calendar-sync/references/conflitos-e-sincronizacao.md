# Conflitos e sincronização

## Regra de sobreposição

Para intervalos semiabertos, há conflito quando:

`inicio_existente < fim_proposto && fim_existente > inicio_proposto`

Assim, `10:00-11:00` e `11:00-12:00` não conflitam.

## Escopo de bloqueio

| Escopo | Aplica quando |
|---|---|
| global | Qualquer evento do tenant ocupa o intervalo |
| profissionais | A equipe proposta intersecta os profissionais bloqueados |

Sem equipe definida, escolha uma política explícita e consistente. Não permita bypass acidental só porque o payload veio incompleto.

## Máquina de sincronização

| Estado | Próxima ação |
|---|---|
| não_configurado | Salvar localmente e orientar conexão |
| pendente | Tentar criar ou atualizar com idempotência |
| sincronizado | Atualizar apenas após mudança relevante |
| erro | Preservar erro, permitir retry e não duplicar |

## Payload externo mínimo

- título sem PII desnecessária;
- início, fim e fuso;
- local e descrição sanitizados;
- identificador local em metadado privado, quando suportado;
- attendees normalizados e deduplicados;
- política explícita de notificações.

## Reagendamento

Trate o banco local como commit principal. Dispare depois:

1. atualização do calendário remoto;
2. recálculo de prazos;
3. reconciliação de convites/clones;
4. reagendamento ou cancelamento de mensagens;
5. auditoria e feedback ao operador.
