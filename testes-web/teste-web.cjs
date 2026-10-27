// Teste da versão web exportada (dist/) no Chrome headless, tela de celular 412 px.
// Uso: npx expo export -p web && NODE_PATH=<pasta com puppeteer-core> node testes-web/teste-web.cjs
// Dados SIMULADOS: o histórico da semana e a "sede" são injetados no armazenamento só para o teste.
const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer-core');
const PORTA = 4199, URL0 = `http://localhost:${PORTA}/`, SHOTS = path.join(__dirname, 'telas');
require('fs').mkdirSync(SHOTS, { recursive: true });
let ok = 0, falhas = 0;
const check = (c, n) => { if (c) { ok++; console.log('OK   ', n); } else { falhas++; console.log('FALHA', n); } };
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const srv = spawn('node', [path.join(__dirname, '..', 'scripts', 'serve-web.mjs')], { env: { ...process.env, PORT: String(PORTA) }, stdio: 'ignore' });
  await dorme(800);
  const nav = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  try {
    const pg = await nav.newPage();
    await pg.setViewport({ width: 412, height: 915, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true });
    const erros = [];
    pg.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    pg.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    const E = (f, ...a) => pg.evaluate(f, ...a);
    const T = (id) => E((i) => { const el = document.querySelector(`[data-testid="${i}"]`); return el ? el.textContent : null; }, id);
    const toque = async (id) => { const s = `[data-testid="${id}"]`; await pg.waitForSelector(s, { visible: true }); await pg.$eval(s, (e) => e.scrollIntoView({ block: 'center' })); await dorme(100); try { await pg.click(s); } catch { await dorme(500); await pg.click(s); } await dorme(150); }; // 2ª tentativa: fade do Modal
    const shot = async (nome, topo = true) => { if (topo) await E(() => document.querySelector('[role=heading]').scrollIntoView({ block: 'start' })); await dorme(400); await pg.screenshot({ path: path.join(SHOTS, nome) }); };
    const tela = async (nome) => { await dorme(300); await pg.screenshot({ path: path.join(SHOTS, nome), fullPage: false }); };

    await pg.goto(URL0, { waitUntil: 'networkidle0' });
    await E(() => localStorage.clear()); await pg.reload({ waitUntil: 'networkidle0' });
    await pg.waitForSelector('[data-testid="beber"]');
    check(await T('copos') === '0/8' && await T('ml') === '0 ml' && await T('metaMl') === '2000', 'início: 0/8, 0 ml de 2000 ml');
    check(/Olá! Toque no botão amarelo/.test(await T('msg')), 'mensagem de boas-vindas');
    check(await T('hResumo') === 'Ainda sem histórico' && await T('mResumo') === '0 de 6 medalhas', 'sem histórico e 0 de 6 medalhas');
    check(await E(() => document.documentElement.scrollWidth <= 412), 'sem rolagem lateral em 412 px');
    check(await E(() => { const b = document.querySelector('[data-testid="beber"]').getBoundingClientRect(); return b.height >= 88; }), 'botão "Bebi um copo" grande (>= 88 px)');
    check(await E(() => !!document.querySelector('link[rel=manifest]') && document.documentElement.lang === 'pt-BR'), 'manifest ligado e idioma pt-BR');
    await shot('01-inicio.png');

    await toque('beber');
    check(await T('copos') === '1/8' && await T('ml') === '250 ml', '1 copo: 1/8, 250 ml');
    check(/Nova medalha: 💧 Primeiro gole/.test(await T('toast') || ''), 'aviso de medalha "Primeiro gole"');
    check(await T('mResumo') === '1 de 6 medalhas', '1 de 6 medalhas');
    await toque('desfazer');
    check(await T('copos') === '0/8' && /desfeito/.test(await T('msg')), 'desfazer volta para 0/8');
    for (let i = 0; i < 8; i++) await toque('beber');
    check(await T('copos') === '8/8' && await T('seq') === '1' && /Meta do dia batida/.test(await T('msg')), '8 copos: meta batida, sequência 1');
    check(await E(() => window.__plantinha.estado().historico[window.__plantinha.estado().dia].ml === 2000), 'histórico de hoje: 2000 ml');
    check(/Bateu a meta em 1 de 7 dias · média 2000 ml\/dia/.test(await T('hResumo')), 'resumo da semana atualizado');
    check(await T('mResumo') === '2 de 6 medalhas', 'Flor aberta ganha (2 de 6)');
    await shot('02-meta-batida.png');

    await toque('config');
    check(await T('copoTxt') === '250' && await T('metaLitros') === '= 2000 ml (2 litros)', 'diálogo: 250 ml, = 2000 ml (2 litros)');
    await toque('ml500'); for (let i = 0; i < 4; i++) await toque('menos');
    check(await T('metaVal') === '4' && await T('metaLitros') === '= 2000 ml (2 litros)', '500 ml x 4 = 2000 ml');
    await tela('03-dialogo-meta.png');
    await toque('salvar');
    check(await T('copos') === '8/4' && await T('ml') === '4000 ml' && /Meta salva: 4 copos de 500 ml \(2000 ml = 2 litros\)/.test(await T('msg')), 'meta salva: 8/4, 4000 ml');
    await toque('config'); await toque('ml250'); for (let i = 0; i < 4; i++) await toque('mais'); await toque('salvar');
    check(await T('copos') === '8/8' && await T('ml') === '2000 ml', 'volta para 8 x 250 ml');

    // despertador
    await toque('dLiga');
    check(/Ligado/.test(await T('dLiga')) && /Próximo lembrete às \d\d:\d\d/.test(await T('dProx')), 'despertador ligado, mostra próximo lembrete');
    await toque('dInt30');
    check(await E(() => window.__plantinha.desp().intervalo === 30), 'intervalo 30 min salvo');
    await toque('inicioMenos'); check(await T('dIni') === '07:45', 'início 08:00 −15 min = 07:45');
    await toque('inicioMais'); check(await T('dIni') === '08:00', 'início volta para 08:00');
    await toque('dTeste');
    check(await E(() => window.__plantinha.somTocando()) && !!(await T('alTit')), 'testar: tela de alarme e som tocando');
    await tela('04-alarme.png');
    await toque('alSoneca');
    check(!(await E(() => window.__plantinha.somTocando())) && /Soneca: toco de novo às/.test(await T('msg')) && /😴/.test(await T('dProx')), 'soneca 10 min: som para e mostra 😴');
    check(await E(() => { const d = window.__plantinha.desp(); return d.soneca - d.ultimoToque === 600000; }), 'soneca = +10 min');
    // alarme de verdade: força soneca vencida
    await E(() => { const d = window.__plantinha.desp(); d.inicio = '00:00'; d.fim = '23:59'; d.soneca = Date.now() - 1000; window.__plantinha.conferirAlarme(); });
    await dorme(300);
    check(!!(await T('alTit')) && /Hora de beber água/.test(await T('msg')), 'alarme vencido dispara a tela de alarme');
    await toque('alBebi');
    await dorme(600); // espera o fade do Modal
    check(await T('copos') === '9/8' && !(await T('alTit')), '"Bebi um copo" no alarme registra o copo e fecha');
    check(await T('mResumo') === '3 de 6 medalhas' && await E(() => !!window.__plantinha.medalhas().desp), 'Despertador amigo ganha (3 de 6)');

    // persistência
    await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForSelector('[data-testid="beber"]');
    check(await T('copos') === '9/8' && /Bem-vindo de volta! 9 copo/.test(await T('msg')) && await T('mResumo') === '3 de 6 medalhas' && /Ligado/.test(await T('dLiga')), 'recarregar mantém copos, medalhas e despertador');
    check(await E(() => ['plantinhaSedenta.v1', 'plantinhaSedenta.despertador', 'plantinhaSedenta.medalhas'].every((k) => !!localStorage.getItem(k))), 'mesmas chaves do PWA no armazenamento');

    // SIMULADO: semana com 7 dias batidos + sequência 7 => Semana perfeita e 7 dias seguidos
    await E(() => {
      const s = JSON.parse(localStorage.getItem('plantinhaSedenta.v1'));
      const dias = []; let d = s.dia; for (let i = 0; i < 7; i++) { dias.push(d); const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); d = x.toISOString().slice(0, 10); }
      const ml = [2000, 2250, 2000, 2500, 2000, 2000, 2250];
      dias.slice(1).forEach((k, i) => { s.historico[k] = { copos: ml[i] / 250, meta: 8, ml: ml[i] }; });
      s.sequencia = 7; s.ultimoDiaMeta = s.dia;
      localStorage.setItem('plantinhaSedenta.v1', JSON.stringify(s));
    });
    await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForSelector('[data-testid="beber"]');
    check(await T('mResumo') === '6 de 6 medalhas' && /Bateu a meta em 7 de 7 dias/.test(await T('hResumo')), '[simulado] 7 dias batidos: 6 de 6 medalhas, 7 de 7 dias');
    await pg.$eval('[data-testid="hist"]', (e) => e.scrollIntoView({ block: 'start' })); await tela('05-historico-medalhas-SIMULADO.png');

    // SIMULADO: sede (último copo há 2 h, meta não batida)
    await E(() => { const s = JSON.parse(localStorage.getItem('plantinhaSedenta.v1')); s.copos = 3; s.ultimoGole = Date.now() - 2 * 3600e3; localStorage.setItem('plantinhaSedenta.v1', JSON.stringify(s));
      const d = JSON.parse(localStorage.getItem('plantinhaSedenta.despertador')); d.ligado = false; localStorage.setItem('plantinhaSedenta.despertador', JSON.stringify(d)); });
    await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForSelector('[data-testid="beber"]');
    await E(() => { window.__plantinha.setAbertura(Date.now() - 2 * 3600e3); window.__plantinha.verificar(); }); await dorme(300);
    check(/plantinha está com sede/.test(await T('msg')) && await E(() => /murcha de sede/.test(document.querySelector('[aria-label^="Plantinha no estágio"]').getAttribute('aria-label'))), '[simulado] 2 h sem beber: murcha e avisa');
    await shot('06-murcha-SIMULADO.png');
    check(erros.length === 0, 'sem erros no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
    // service worker
    await dorme(1500);
    check(await E(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!r; }), 'service worker registrado');
    const cdp = await pg.target().createCDPSession();
    const inst = (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors;
    check(inst.length === 0, 'instalável como app (PWA)' + (inst.length ? ': ' + JSON.stringify(inst) : ''));
  } finally {
    await nav.close(); srv.kill();
  }
  console.log(`\n${ok}/${ok + falhas} verificações OK`);
  process.exit(falhas ? 1 : 0);
})();
