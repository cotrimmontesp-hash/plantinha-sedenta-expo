# Remove o canal alpha dos PNGs que precisam ser opacos (ícone 1024 da loja, fundo adaptável, ícones PWA com fundo).
from PIL import Image
import os
raiz = os.path.join(os.path.dirname(__file__), '..')
for rel in ['assets/icon.png', 'assets/android-icon-background.png', 'assets/favicon.png',
            'public/logo192.png', 'public/logo512.png', 'public/maskable512.png']:
    p = os.path.join(raiz, rel)
    im = Image.open(p).convert('RGBA')
    fundo = Image.new('RGB', im.size, (11, 29, 42))
    fundo.paste(im, mask=im.split()[3])
    fundo.save(p, optimize=True)
    print(rel, Image.open(p).mode, Image.open(p).size)
