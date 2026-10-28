// Teste "sem rolagem": na web exportada (dist/), em vários tamanhos de celular, cada aba e cada janela
// tem de caber inteira na tela: (1) a página não rola (scrollHeight <= innerHeight, scrollWidth <= innerWidth),
// (2) nenhum elemento com overflow scroll/auto tem conteúdo maior que a caixa, (3) nenhum texto/botão fica
// fora da tela ou cortado por um pai com overflow hidden, (4) "Bebi um copo" e a barra de abas aparecem e
// recebem o toque. DADOS SIMULADOS no armazenamento (como prints-abas.cjs).
// Uso: npx expo export -p web && NODE_PATH=<pasta com puppeteer-core> node testes-web/sem-rolagem.cjs [LxA ...]
// Sem argumentos: 412x915 (A14) e 360x740 (tela menor) contam como teste; 360x640 e fonte 1,3x só informam.
const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer-core');
const PORTA = 4196;
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const TAMANHOS = args.length ? args.map((a) => { const [w, h] = a.split('x').map(Number); return { w, h, conta: true }; })
  : [{ w: 412, h: 915, conta: true }, { w: 360, h: 740, conta: true }, { w: 360, h: 640, conta: false }];
let ok = 0, falhas = 0, info = 0;
const check = (conta, c, n) => { if (!conta) { info++; console.log(c ? 'info OK   ' : 'info FALHA', n); return; } if (c) { ok++; console.log('OK   ', n); } else { falhas++; console.log('FALHA', n); } };

// roda na página: mede rolagem e cortes
function medir() {
  const W = innerWidth, H = innerHeight, se = document.scrollingElement;
  const rolam = [], cortados = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if ((/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) || (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1))
      rolam.push((el.dataset.testid || el.tagName) + ' ' + el.scrollHeight + '>' + el.clientHeight);
  }
  const folhas = [...document.querySelectorAll('[data-testid], [role=button], [role=tab]')];
  for (const el of document.querySelectorAll('body *')) if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) folhas.push(el);
  for (const el of folhas) {
    if (el.id === 'simulado' || el.closest('#simulado') || el.closest('svg')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || getComputedStyle(el).visibility === 'hidden') continue;
    let fora = r.top < -1 || r.left < -1 || r.bottom > H + 1 || r.right > W + 1;
    for (let p = el.parentElement; p && !fora && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') {
        const q = p.getBoundingClientRect();
        if (r.top < q.top - 1 || r.bottom > q.bottom + 1 || r.left < q.left - 1 || r.right > q.right + 1) fora = true;
      }
    }
    if (fora) cortados.push((el.dataset.testid || el.textContent.trim().slice(0, 30)) + ' [' + Math.round(r.top) + '..' + Math.round(r.bottom) + ']');
  }
  const visivel = (s) => { const el = document.querySelector(s); if (!el) return false; const r = el.getBoundingClientRect(); if (r.top < 0 || r.bottom > H + 1 || r.height < 1) return false;
    const a = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!a && (el === a || el.contains(a)); };
  const enc = [...document.querySelectorAll('[data-testid^="encaixe"]')].map((e) => { const r = e.getBoundingClientRect(); return e.offsetHeight ? r.height / e.offsetHeight : 1; });
  return { docH: se.scrollHeight, docW: se.scrollWidth, W, H, rolam, cortados: [...new Set(cortados)], beber: visivel('[data-testid="beber"]'),
    abas: ['hoje', 'historico', 'conquistas', 'ajustes'].every((i) => visivel(`[data-testid="aba-${i}"]`)), escala: Math.min(1, ...enc) };
}
function fonteMaior(f) { // simula a fonte do sistema maior: multiplica fonte e altura de linha de cada texto
  for (const el of document.querySelectorAll('body *')) { if (el.closest('svg') || el.dataset.fonte) continue; const cs = getComputedStyle(el);
    el.dataset.fonte = '1'; el.style.fontSize = parseFloat(cs.fontSize) * f + 'px'; if (cs.lineHeight !== 'normal') el.style.lineHeight = parseFloat(cs.lineHeight) * f + 'px'; }
}
function simular() { // SIMULADO: 5 copos hoje, 6 dias de histórico, sequência 4, despertador ligado
  const s = JSON.parse(JSON.stringify(window.__plantinha.estado()));
  const dias = []; let d = s.dia; for (let i = 0; i < 7; i++) { dias.push(d); const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); d = x.toISOString().slice(0, 10); }
  const copos = [8, 9, 6, 8, 10, 8];
  dias.slice(1).forEach((k, i) => { s.historico[k] = { copos: copos[i], meta: 8, ml: copos[i] * 250 }; });
  s.copos = 5; s.historico[s.dia] = { copos: 5, meta: 8, ml: 1250 }; s.ultimoGole = Date.now() - 10 * 60e3; s.sequencia = 4; s.ultimoDiaMeta = dias[1];
  localStorage.setItem('plantinhaSedenta.v1', JSON.stringify(s));
  const dp = JSON.parse(JSON.stringify(window.__plantinha.desp()));
  Object.assign(dp, { ligado: true, intervalo: 60, inicio: '08:00', fim: '22:00', ligadoEm: Date.now() - 3600e3 });
  localStorage.setItem('plantinhaSedenta.despertador', JSON.stringify(dp));
}

(async () => {
  const srv = spawn('node', [path.join(__dirname, '..', 'scripts', 'serve-web.mjs')], { env: { ...process.env, PORT: String(PORTA) }, stdio: 'ignore' });
  await dorme(800);
  const nav = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const tabela = [];
  try {
    for (const { w, h, conta } of TAMANHOS) {
      const pg = await nav.newPage();
      await pg.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const T = (id) => pg.evaluate((i) => document.querySelector(`[data-testid="${i}"]`)?.textContent ?? null, id);
      const aba = async (id) => { await pg.click(`[data-testid="aba-${id}"]`); await pg.waitForSelector(`[data-testid="aba-${id}"][aria-selected="true"]`); await dorme(400); };
      const toque = async (id) => { const s = `[data-testid="${id}"]`; await pg.waitForSelector(s, { visible: true }); await dorme(100); try { await pg.click(s); } catch { await dorme(500); await pg.click(s); } await dorme(500); };
      const conferir = async (nome, { beber = false, abas = true } = {}) => {
        const m = await pg.evaluate(medir), v = `${w}x${h}`;
        tabela.push(`${v.padEnd(8)} ${nome.padEnd(22)} página ${m.docH}/${m.H} px  escala ${m.escala.toFixed(2)}  rolam ${m.rolam.length}  cortados ${m.cortados.length}`);
        check(conta, m.docH <= m.H && m.docW <= m.W, `${v} ${nome}: página não rola (${m.docH} <= ${m.H}, largura ${m.docW} <= ${m.W})`);
        check(conta, m.rolam.length === 0, `${v} ${nome}: nenhum elemento com rolagem interna` + (m.rolam.length ? ': ' + m.rolam.join(', ') : ''));
        check(conta, m.cortados.length === 0, `${v} ${nome}: nada fora da tela nem cortado` + (m.cortados.length ? ': ' + m.cortados.slice(0, 6).join(' | ') : ''));
        if (abas) check(conta, m.abas, `${v} ${nome}: barra de abas visível e tocável`);
        if (beber) check(conta, m.beber, `${v} ${nome}: "Bebi um copo" visível e tocável`);
        return m;
      };
      await pg.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle0' });
      await pg.evaluate(() => localStorage.clear()); await pg.reload({ waitUntil: 'networkidle0' });
      await pg.waitForSelector('[data-testid="beber"]');
      await conferir('hoje (início)', { beber: true });
      await toque('beber'); // 1º copo => aviso de medalha "Primeiro gole"
      check(conta, /Primeiro gole/.test((await T('toast')) || ''), `${w}x${h} aviso de medalha apareceu`);
      await conferir('aviso de medalha', { beber: true });
      await pg.evaluate(simular); await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForSelector('[data-testid="beber"]'); await dorme(5200); // aviso some
      await conferir('hoje (simulado)', { beber: true });
      await aba('historico'); await conferir('histórico (simulado)');
      await aba('conquistas'); await conferir('conquistas (simulado)');
      await aba('ajustes'); await conferir('ajustes (simulado)');
      await toque('config'); await conferir('janela meta', { abas: false }); await toque('salvar');
      await toque('dTeste'); check(conta, !!(await T('alTit')), `${w}x${h} tela de alarme abriu`); await conferir('janela alarme', { abas: false }); await toque('alSoneca');
      // sede (mensagem em destaque, 2 linhas) na aba Hoje
      await aba('hoje'); await pg.evaluate(() => { window.__plantinha.setAbertura(Date.now() - 2 * 3600e3); const s = window.__plantinha.estado(); s.ultimoGole = Date.now() - 2 * 3600e3; window.__plantinha.verificar(); }); await dorme(400);
      await conferir('hoje (sede/soneca)', { beber: true });
      // fonte do sistema 1,3x (só informativo)
      for (const id of ['hoje', 'historico', 'conquistas', 'ajustes']) {
        await aba(id); await pg.evaluate(fonteMaior, 1.3); await dorme(500);
        const m = await pg.evaluate(medir);
        tabela.push(`${(w + 'x' + h).padEnd(8)} ${('fonte 1,3x ' + id).padEnd(22)} página ${m.docH}/${m.H} px  escala ${m.escala.toFixed(2)}  rolam ${m.rolam.length}  cortados ${m.cortados.length}`);
        check(false, m.docH <= m.H && m.rolam.length === 0 && m.cortados.length === 0, `${w}x${h} fonte 1,3x ${id}: sem rolagem e sem corte` + (m.cortados.length ? ': ' + m.cortados.slice(0, 4).join(' | ') : ''));
        await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForSelector('[data-testid="beber"]');
      }
      await pg.close();
    }
  } finally { await nav.close(); srv.kill(); }
  console.log('\nMedidas:\n' + tabela.join('\n'));
  console.log(`\n${ok}/${ok + falhas} verificações OK (+ ${info} só informativas)`);
  process.exit(falhas ? 1 : 0);
})();
