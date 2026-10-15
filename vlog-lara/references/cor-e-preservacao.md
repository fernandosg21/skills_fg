# Cor, montagem e validação

Leia antes de corrigir cores ou substituir cenas em uma montagem aprovada. O diagnóstico por clipe do `SKILL.md` vem primeiro.

## Identificar qual edição deve ser preservada

Registre caminho, SHA256, duração, contagem de quadros, fps, time base, áudio e metadados de cor da edição aprovada. Compare o conteúdo com a referência do usuário; nome parecido ou data mais recente não identificam a montagem correta. Em Caixas Misteriosas, a edição curta aprovada tinha cerca de 14:55 e diferia da montagem histórica de 19:24. Isso é um exemplo de identificação, não uma duração obrigatória.

Se a edição aprovada tiver cortes diferentes do projeto anterior, mapear seus quadros às fontes antes de substituir cenas. Não devolver a montagem anterior inteira. Preservar transições, enquadramentos, inserts, títulos e demais gráficos, inclusive os já incorporados à imagem. Conservar fontes e versões anteriores até a validação da substituição.

## Interpretar a captura antes do grading

Nos materiais examinados deste lote houve originais HEVC Main 10, BT.2020/HLG, com base HLG de Dolby Vision 8.4. Essa evidência explica a correção usada nesses arquivos; não identifica automaticamente qualquer vídeo do iPhone. Materiais SDR e outras capturas exigem interpretação própria.

Registrar por original `color_primaries`, `color_transfer`, `color_space`, `color_range`, profundidade, side data e dispositivo/modo quando disponíveis. Conferir pixels, rotação e procedência. Quando necessário, consultar documentação técnica primária do formato e da ferramenta. Não aplicar presets de HDR/Log por extensão, aparelho ou aparência.

Fazer a transformação técnica de entrada e, para SDR, tone mapping e conversão de gamut adequados ao perfil confirmado. Só depois aplicar ajustes leves de cor. Etiquetar a saída corretamente não substitui a transformação dos pixels. Reduzir saturação/exposição do MP4 já estourado não recupera as altas luzes perdidas: reconstruir a partir dos originais na mesma montagem.

Comparar quadros representativos e uma prévia exportada: pele, cabelo, brancos, sombras, amarelos/azuis fortes e detalhes claros. Guardar diagnóstico, comando/transformação, quadros e aprovação. Quando a prévia de cor já tiver sido aprovada para o escopo atual, aplicar a solução às fontes do mesmo perfil, conferindo outros ambientes; não pedir a mesma aprovação novamente.

## Preservar apenas o que a tarefa autoriza mudar

| Pedido | Pode mudar | Deve permanecer |
|---|---|---|
| Somente cor | Pixels das cenas, interpretação e metadados de cor correspondentes | Montagem, cortes, quadros/tempos, transições, inserts/gráficos e áudio aprovado |
| Somente trilha | Mix de áudio e créditos | Imagem codificada, quadros, tempos, montagem e metadados de cor |
| Capa ou organização da entrega | Imagem da capa ou metadados/pastas autorizados | Conteúdo dos vídeos e histórico de versões |

Não normalizar, limpar, recortar nem deslocar novamente a voz em uma revisão apenas de cor ou trilha. Normalização de áudio na montagem inicial não autoriza reaplicá-la a uma edição aprovada.

Em mixagem sobre um MP4 final, usar cópia do fluxo de vídeo (`-c:v copy`). Preservar a time base original ao muxar quando for necessária identidade dos timestamps: em Caixas, `-video_track_timescale 30` manteve a base 1/30; esse valor não é um preset para todos os arquivos. Comparar também tempos absolutos: mudança de unidade dos timestamps não prova retiming, mas deve ser registrada e, quando possível, evitada.

## Evidência proporcional à alteração

- Cor: comparar timeline, contagem/tempos dos quadros, posições dos gráficos, metadados e áudio preservado. Não exigir hash visual idêntico de imagens cujas cores foram alteradas.
- Trilha: comparar todos os pacotes do vídeo (payload/hash, PTS/DTS, duração e flags), fps/time base e metadados de cor; verificar o novo AAC contra o mix planejado, sincronismo e picos. O áudio mudou intencionalmente, portanto não declarar AAC idêntico à versão sem música.
- Decodificar o render completo para detectar erros; conferir quadros e ouvir transições e trechos críticos. Em AAC, distinguir padding do decodificador e arredondamentos de contêiner de um deslocamento real da fala. Não retimar o vídeo para apagar diferenças submilissegundo de metadados.
- Renomear/mover no Drive não exige novo render: verificar identidade, bytes, destino e acesso. Medições técnicas e upload confirmado não equivalem à revisão humana integral nem à aprovação editorial.

Guardar relatórios por etapa. Um recibo local anterior ao upload com `cloud_upload_verified=false` continua correto historicamente; adicionar o recibo remoto posterior, sem reescrever o estágio anterior.

## Evidências locais para consultar, sem executar automaticamente

Na raiz `A:/2026/Vídeos Lara`: `CORRECAO-HDR-CAIXAS-V03-VERIFICADA.json`, `.correcao-hdr-demais-2026-10-14/`, `.trilhas-demais-v01/produzir.py` e os planos/relatórios em `assets/trilha-v01/` de cada projeto. São referências de implementações testadas; revisar caminhos, fontes e parâmetros antes de adaptar.
