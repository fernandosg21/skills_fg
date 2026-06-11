# Conformidade legal — assinatura eletrônica e cláusulas contratuais (Brasil)

## 1. Enquadramento jurídico da assinatura

O sistema implementa **assinatura eletrônica avançada** (não qualificada), na taxonomia da
**Lei 14.063/2020, art. 4º**:

- **Simples**: identifica o signatário (um clique, um aceite).
- **Avançada**: usa dados sob controle exclusivo do signatário, com vínculo unívoco e
  capacidade de detectar alteração posterior → **é este o alvo**: CPF conferido + traçado +
  evidências + hash de integridade.
- **Qualificada**: certificado ICP-Brasil (MP 2.200-2, art. 10 §1º) — fora do escopo, mas
  o desenho não deve impedi-la no futuro.

Base de validade entre particulares: **MP 2.200-2/2001, art. 10, §2º** — admite-se
qualquer meio de comprovação de autoria e integridade "inclusive os que utilizem
certificados não emitidos pela ICP-Brasil, desde que admitido pelas partes como válido".
O contrato deve, portanto, conter **cláusula de aceitação do meio eletrônico** pelas
partes. Jurisprudência consolidada aceita assinatura eletrônica avançada inclusive como
título executivo extrajudicial quando há evidências robustas (STJ, REsp 1.495.920/DF e
posteriores).

### Elementos que sustentam a validade (implemente TODOS)

| Requisito jurídico | Implementação técnica |
|---|---|
| Manifestação de vontade expressa | Checkbox de aceite com texto + **persistência do aceite** (texto, versão, timestamp) |
| Autoria / vínculo ao signatário | CPF conferido contra cadastro, traçado biométrico-comportamental, link enviado ao e-mail/telefone do cadastro (canal sob controle do signatário) |
| Integridade do documento | SHA-256 do documento assinado E do visualizado; verificação a cada download |
| Tempestividade | Timestamp com timezone; ideal: carimbo TSA RFC 3161 |
| Trilha de auditoria | IP, user-agent, datas de envio/visualização/assinatura; código de verificação HMAC |
| Acesso das partes ao documento | Download permanente pelo link + cópia por e-mail ao signatário |

**A referência (Memora) NÃO cita a base legal no documento nem na UI** — corrija: inclua
no rodapé do contrato e na página de assinatura um bloco do tipo: "Documento assinado
eletronicamente nos termos do art. 10, §2º da MP 2.200-2/2001 e da Lei 14.063/2020.
Código de verificação: XXXX. Valide em <url>/verificar".

## 2. LGPD (Lei 13.709/2018)

- Base legal do tratamento: execução de contrato (art. 7º, V) para os dados contratuais;
  consentimento (art. 7º, I) para uso de imagem.
- CPF e traçado de assinatura são dados pessoais — minimize exposição (máscara
  `***.XXX.***-**` na UI), cifre/tokenize no banco, defina retenção.
- A referência não tem cláusula LGPD nos modelos — **adicione** cláusula de tratamento de
  dados (finalidade, compartilhamento, prazo de guarda, canal do titular).

## 3. Estrutura de cláusulas dos modelos (extraída dos DOCX oficiais do Memora)

Esqueleto comum a todos os tipos (aniversário, casamento, ensaio, corporativo, newborn):

1. **Qualificação das partes** — contratada (tags do wizard) e contratante (tags do cliente,
   PF ou PJ).
2. **Objeto** — `[PACOTE_NOME]` + `[CONTEUDO_PACOTE]`.
3. **Informações do evento** — bloco variável por tipo (tema/fornecedores; roteiro
   corporativo; dados do bebê no newborn).
4. **Preço e forma de pagamento** — quadro bancário com PIX.
5. **Prazos de entrega** — `[PRAZOS_ENTREGA]` (dias úteis + datas-limite calculadas).
6. **Excedentes** — `{EXCEDENTES_CONTRATO}` (tabela de valores de hora extra etc.).
7. **Cancelamento/rescisão** — direito de arrependimento 7 dias (**CDC art. 49**); multa
   escalonada 15% (aviso ≥30d) / 30% (<15d) corrigida pelo IGPM; cancelamento pela
   contratada sem força maior (**CC art. 393**) → devolução integral + multa compensatória
   15% (**CC arts. 408/418**).
8. **Informações gerais** (~16 itens): reserva só após 1ª parcela; execução; reagendamento;
   entrega e armazenamento de arquivos; excludentes de responsabilidade;
   **confidencialidade** (corporativo); validade da proposta 12 meses; substituição em
   emergências; **uso de imagem** (`[USO_IMAGem]` = "autoriza"/"NÃO AUTORIZA" — **CC
   art. 20, CF art. 5º, X**); **direitos autorais** (**Lei 9.610/98** — obra da contratada,
   licença pessoal não exclusiva ao cliente); segurança do bebê e reagendamento por saúde
   (newborn).
9. **Foro de eleição** — `{CIDADE}–{UF_DO_FORO}` (**CPC art. 63**).
10. **Declaração de ciência** + data + bloco de assinaturas (`{ASSINATURA_FOTOGRAFO}`
    imagem do emissor; `[ASSINATURA_CLIENTE][DATA_ASSINATURA]` preenchidos na assinatura
    eletrônica).

Ao adaptar para outro nicho, mantenha os itens 7-10 (são o núcleo jurídico) e troque os
blocos 2-6 pelo domínio do negócio. **Recomende sempre revisão por advogado** — os modelos
da referência foram revisados juridicamente; um modelo gerado por IA não substitui isso.

## 4. Checklist de conformidade ao entregar

- [ ] Cláusula de aceitação do meio eletrônico pelas partes no corpo do contrato
- [ ] Bloco legal (MP 2.200-2 art. 10 §2º + Lei 14.063) carimbado no documento assinado
- [ ] Código de verificação impresso no documento + página pública de validação
- [ ] Aceite persistido (texto + versão + timestamp + IP)
- [ ] Hash do documento visualizado E do assinado, verificados em todo download
- [ ] Cópia do contrato assinado enviada ao signatário (e-mail)
- [ ] Cláusula LGPD + minimização de CPF (máscara na UI, cifra no banco)
- [ ] Direito de arrependimento (CDC art. 49) quando venda fora do estabelecimento
- [ ] Direitos autorais (Lei 9.610) e uso de imagem (CC art. 20) quando houver mídia
- [ ] Foro de eleição (CPC art. 63)
- [ ] Aviso de que assinatura qualificada ICP-Brasil é upgrade possível, não requisito
