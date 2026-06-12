# Separar Arte em Camadas PSD

Skill para transformar uma arte achatada em PNG/JPG/JPEG em um PSD com camadas rasterizadas organizadas.

## Onde usar

Use esta skill em atendimentos onde o usuário envia uma arte pronta e precisa editar no Photoshop, reaproveitar como template, substituir fotos/textos, limpar o fundo ou isolar elementos visuais. Ela é indicada especialmente para posts, stories, convites, artes promocionais, templates de fotografia, anúncios e peças criadas em imagem única sem arquivo editável.

## Quando acionar

Acione quando o pedido mencionar termos como:

- “separe em camadas”;
- “me entregue um PSD”;
- “transforme essa arte em template”;
- “preciso editar essa arte no Photoshop”;
- “isole fundo, textos, fotos, molduras e ornamentos”.

## Como utilizar

1. Receba a imagem original e confirme as dimensões.
2. Monte um mapa de camadas com os grupos visuais principais.
3. Gere máscaras por região, cor, contraste ou seleção manual.
4. Reconstrua o fundo limpo removendo os elementos destacados.
5. Exporte cada camada em PNG de canvas completo, mantendo o alinhamento.
6. Monte o PSD com as camadas em ordem lógica.
7. Gere uma prévia composta e valide visualmente contra a arte original.
8. Entregue o PSD informando que, quando a origem é achatada, os textos ficam rasterizados, salvo se forem recriados manualmente.

## Conteúdo do pacote

- `SKILL.md` — instruções principais da skill.
- `scripts/make_layered_psd_from_flat_image.py` — helper opcional para gerar camadas PNG, prévia composta e PSD a partir de um JSON de máscaras.
- `examples/config_dia_dos_namorados.example.json` — exemplo baseado no resultado aprovado.
- `prompts/prompt_mapa_de_camadas.md` — prompt para planejar a separação antes da execução.
- `checklists/qa_psd_camadas.md` — checklist de qualidade antes da entrega.

## Uso rápido do helper

```bash
python scripts/make_layered_psd_from_flat_image.py input.png \
  --config examples/config_dia_dos_namorados.example.json \
  --out_dir /mnt/data/layerwork_new \
  --psd /mnt/data/arte_em_camadas.psd
```

O JSON de configuração deve ser ajustado às coordenadas da arte atual. O helper é semiautomático: ele acelera a criação de camadas, mas a inspeção visual e os ajustes manuais continuam obrigatórios.

## Limitação importante

A partir de uma arte achatada, o PSD resultante normalmente contém camadas rasterizadas. Texto editável, vetores reais e fontes originais só devem ser prometidos quando forem recriados manualmente ou quando o arquivo-fonte original estiver disponível.
