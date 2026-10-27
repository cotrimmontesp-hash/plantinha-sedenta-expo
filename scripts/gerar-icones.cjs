// Gera os ícones e a splash da Plantinha Sedenta a partir de um SVG próprio (sem o ícone do Expo).
// Uso: NODE_PATH=<pasta com puppeteer-core> node scripts/gerar-icones.cjs   (precisa do Google Chrome)
// Depois: python3 scripts/tirar-alpha.py  (remove o canal alpha do icon.png e do fundo adaptável)
const path = require('path');
const puppeteer = require('puppeteer-core');
const OUT = path.join(__dirname, '..', 'assets');
const PUB = path.join(__dirname, '..', 'public');
const FUNDO = '#0b1d2a';

// Desenho em 300x320 (mesmo do jogo), com uma gota d'água no alto.
function arte(cor) {
  const m = cor ? `fill="${cor}"` : null; // monocromático
  const f = (c) => (m ? m : `fill="${c}"`);
  const s = (c) => (m ? `stroke="${cor}"` : `stroke="${c}"`);
  return `
  <path d="M95 255 L205 255 L192 315 L108 315 Z" ${f('#c8693b')} ${s('#7a3a1c')} stroke-width="4"/>
  <rect x="88" y="244" width="124" height="18" rx="6" ${f('#d97a48')} ${s('#7a3a1c')} stroke-width="4"/>
  <path d="M150 248 Q140 172 150 95" ${s('#3fae4a')} stroke-width="9" fill="none" stroke-linecap="round"/>
  <ellipse cx="128" cy="190" rx="26" ry="12" ${f('#4cd35a')} transform="rotate(-25 128 190)"/>
  <ellipse cx="174" cy="165" rx="28" ry="13" ${f('#4cd35a')} transform="rotate(25 174 165)"/>
  <ellipse cx="126" cy="135" rx="26" ry="12" ${f('#45c653')} transform="rotate(-25 126 135)"/>
  <ellipse cx="172" cy="122" rx="22" ry="10" ${f('#45c653')} transform="rotate(25 172 122)"/>
  <g>
    <circle cx="150" cy="66" r="18" ${f('#ff6fae')}/><circle cx="150" cy="118" r="18" ${f('#ff6fae')}/>
    <circle cx="124" cy="92" r="18" ${f('#ff6fae')}/><circle cx="176" cy="92" r="18" ${f('#ff6fae')}/>
    <circle cx="132" cy="74" r="16" ${f('#ff8cc0')}/><circle cx="168" cy="74" r="16" ${f('#ff8cc0')}/>
    <circle cx="132" cy="110" r="16" ${f('#ff8cc0')}/><circle cx="168" cy="110" r="16" ${f('#ff8cc0')}/>
    <circle cx="150" cy="92" r="14" ${f('#ffd23f')}/>
  </g>
  <path d="M238 18 C220 50 214 66 238 78 C262 66 256 50 238 18 Z" ${f('#4fc3ff')} ${m ? '' : 'stroke="#bfe9ff" stroke-width="3"'}/>`;
}
// escala: fração do lado ocupada pela arte (altura 320)
function svg(lado, { fundo = null, escala = 0.8, cor = null } = {}) {
  const k = (lado * escala) / 320, w = 300 * k, h = 320 * k;
  const tx = (lado - w) / 2, ty = (lado - h) / 2;
  const bg = fundo
    ? `<defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#1d4a6b"/><stop offset="1" stop-color="${fundo}"/></radialGradient></defs><rect width="${lado}" height="${lado}" fill="url(#g)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">${bg}<g transform="translate(${tx} ${ty}) scale(${k})">${arte(cor)}</g></svg>`;
}
const ALVOS = [
  // [arquivo, lado, opções]
  [path.join(OUT, 'icon.png'), 1024, { fundo: FUNDO, escala: 0.78 }],
  [path.join(OUT, 'android-icon-foreground.png'), 1024, { escala: 0.56 }], // zona segura ~66%
  [path.join(OUT, 'android-icon-background.png'), 1024, { fundo: FUNDO, escala: 0 }],
  [path.join(OUT, 'android-icon-monochrome.png'), 1024, { escala: 0.56, cor: '#ffffff' }],
  [path.join(OUT, 'splash-icon.png'), 1024, { escala: 0.9 }],
  [path.join(OUT, 'favicon.png'), 48, { fundo: FUNDO, escala: 0.86 }],
  [path.join(OUT, 'notification-icon.png'), 96, { escala: 0.86, cor: '#ffffff' }],
  [path.join(PUB, 'logo192.png'), 192, { fundo: FUNDO, escala: 0.78 }],
  [path.join(PUB, 'logo512.png'), 512, { fundo: FUNDO, escala: 0.78 }],
  [path.join(PUB, 'maskable512.png'), 512, { fundo: FUNDO, escala: 0.56 }],
];
(async () => {
  const nav = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const pg = await nav.newPage();
  for (const [arq, lado, op] of ALVOS) {
    const s = op.escala === 0 ? `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="100%" height="100%" fill="${FUNDO}"/></svg>` : svg(lado, op);
    await pg.setViewport({ width: lado, height: lado, deviceScaleFactor: 1 });
    await pg.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    await pg.screenshot({ path: arq, omitBackground: !op.fundo && op.escala !== 0, clip: { x: 0, y: 0, width: lado, height: lado } });
    console.log('ok', path.relative(process.cwd(), arq), lado);
  }
  await nav.close();
})();
