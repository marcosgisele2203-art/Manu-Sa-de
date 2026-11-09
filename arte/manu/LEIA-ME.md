# Artes originais da Manu

PNGs originais (1024×1536, fundo transparente). **Não são publicados no site** (o Dockerfile copia só `public/`).

O site usa versões WebP em `public/images/`:

- `manu-*.webp`: 512×768, para onde a Manu aparece grande (página inicial, conta, primeiro acesso).
- `manu-*-p.webp`: 192×288, para onde aparece pequena (avisos, telas vazias, ajuda, comprovante).

Para gerar de novo a partir de uma arte nova (precisa de Python com Pillow):

```bash
python3 -c "
from PIL import Image
im=Image.open('arte/manu/NOME.png').convert('RGBA')
for suf,w,q in [('',512,82),('-p',192,85)]:
    im.resize((w,round(im.height*w/im.width)),Image.LANCZOS).save(f'public/images/NOME{suf}.webp','WEBP',quality=q,method=6)
"
```
