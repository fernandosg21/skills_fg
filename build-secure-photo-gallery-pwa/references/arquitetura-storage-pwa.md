# Arquitetura de storage e PWA

## Fronteiras

```text
Painel autenticado -> API principal -> banco/metadados/cotas
Navegador -> PUT pré-assinado -> bucket privado
Galeria pública -> API principal -> GET assinado curto
Worker -> API HMAC -> jobs -> GET/PUT/DELETE assinados
Gateway HTTPS -> proxy somente; sem banco e sem segredo do bucket
```

## Estados

| Estado | Vaga ativa | Bytes | Acesso público |
|---|---:|---:|---|
| draft/processing | conforme produto | sim | não |
| published | sim | sim | sim |
| expired | não | sim | bloqueado |
| archived | não | sim | bloqueado ou leitura administrativa |
| trash | não | sim até purge | bloqueado |

## Service worker

Permita cache apenas de:

- CSS/JS versionados;
- ícone e manifest públicos;
- documento offline genérico.

Bloqueie cache de:

- navegação da galeria;
- `/api/`;
- URLs assinadas;
- imagens e ZIPs;
- respostas que carregam sessão.

## Contabilização de upload

`reservado + confirmado + liberado = auditável por tenant`.

Faça uma rotina que compare metadados locais, reservas vencidas e objetos existentes sem apagar automaticamente o que não puder atribuir com segurança.

## TLS por origem

Se usar subdomínios por galeria, autorize emissão somente para host opaco válido e galeria publicada/expirada/arquivada. Antes de escalar TLS sob demanda, planeje wildcard ou automação DNS e considere limites da autoridade certificadora.
