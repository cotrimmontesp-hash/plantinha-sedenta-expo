// Prints das 4 abas (e das janelas meta e alarme) na web (dist/), tela de celular 390x844 ou a do 2º argumento (ex. 412x915), com DADOS SIMULADOS no armazenamento
// (5 copos hoje, 6 dias de histórico, sequência 4, despertador ligado) e uma etiqueta "dados simulados" no canto.
// Uso: npx expo export -p web && NODE_PATH=<pasta com puppeteer-core> node testes-web/prints-abas.cjs <pasta de saída> [LxA]
const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer-core');
const PORTA = 4197, SAIDA = path.resolve(process.argv[2] || path.join(__dirname, 'telas'));
const [LARG, ALT] = (process.argv[3] || '390x844').split('x').map(Number);
require('fs').mkdirSync(SAIDA, { recursive: true });
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const srv = spawn('node', [path.join(__dirname, '..', 'scripts', 'serve-web.mjs')], { env: { ...process.env, PORT: String(PORTA) }, stdio: 'ignore' });
  await dorme(800);
  const nav = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  try {
    const pg = await nav.newPage();
    await pg.setViewport({ width: LARG, height: ALT, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await pg.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle0' });
    await pg.evaluate(() => localStorage.clear()); await pg.reload({ waitUntil: 'networkidle0' });
    await pg.waitForSelector('[data-testid="beber"]');
    await pg.evaluate(() => { // SIMULADO (parte do estado novo do app)
      const s = JSON.parse(JSON.stringify(window.__plantinha.estado()));
      const dias = []; let d = s.dia; for (let i = 0; i < 7; i++) { dias.push(d); const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); d = x.toISOString().slice(0, 10); }
      const copos = [8, 9, 6, 8, 10, 8];
      dias.slice(1).forEach((k, i) => { s.historico[k] = { copos: copos[i], meta: 8, ml: copos[i] * 250 }; });
      s.copos = 5; s.historico[s.dia] = { copos: 5, meta: 8, ml: 1250 }; s.ultimoGole = Date.now() - 10 * 60e3; s.sequencia = 4; s.ultimoDiaMeta = dias[1];
      localStorage.setItem('plantinhaSedenta.v1', JSON.stringify(s));
      const dp = JSON.parse(JSON.stringify(window.__plantinha.desp()));
      Object.assign(dp, { ligado: true, intervalo: 60, inicio: '08:00', fim: '22:00', ligadoEm: Date.now() - 3600e3 });
      localStorage.setItem('plantinhaSedenta.despertador', JSON.stringify(dp));
    });
    await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForSelector('[data-testid="beber"]'); await dorme(5200); // espera o aviso de medalha sumir
    const etiqueta = () => pg.evaluate(() => { if (document.getElementById('simulado')) return; const e = document.createElement('div'); e.id = 'simulado'; e.textContent = 'dados simulados';
      Object.assign(e.style, { position: 'fixed', top: '4px', right: '4px', zIndex: 9999, background: '#7c3aed', color: '#fff', font: '700 12px sans-serif', padding: '3px 7px', borderRadius: '6px' }); document.body.appendChild(e); });
    const abas = [['hoje', '1-hoje'], ['historico', '2-historico'], ['conquistas', '3-conquistas'], ['ajustes', '4-ajustes']];
    for (const [id, nome] of abas) {
      await pg.click(`[data-testid="aba-${id}"]`); await dorme(600); await etiqueta();
      await pg.screenshot({ path: path.join(SAIDA, `${nome}-SIMULADO.png`) });
      console.log('print', path.join(SAIDA, `${nome}-SIMULADO.png`));
    }
    // janelas (sem rolagem não há mais "metade de baixo" de Ajustes para fotografar)
    const foto = async (nome) => { await dorme(700); await etiqueta(); await pg.screenshot({ path: path.join(SAIDA, nome) }); console.log('print', path.join(SAIDA, nome)); };
    await pg.click('[data-testid="config"]'); await foto('5-janela-meta-SIMULADO.png'); await pg.click('[data-testid="salvar"]'); await dorme(600);
    await pg.click('[data-testid="dTeste"]'); await foto('6-janela-alarme-SIMULADO.png'); await pg.click('[data-testid="alSoneca"]');
  } finally { await nav.close(); srv.kill(); }
})();
