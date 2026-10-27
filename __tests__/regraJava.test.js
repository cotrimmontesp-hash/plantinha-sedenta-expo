// O alarme nativo do Android (modules/plantinha-alarme/.../Regra.java) precisa calcular o próximo toque
// EXATAMENTE como o app (src/logica.ts) e a agenda de 7 dias (src/agenda.ts). Este teste compila o Java
// e compara com o JavaScript em milhares de casos. Precisa de um JDK (javac); sem JDK o teste é pulado.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('../src/logica');
const A = require('../src/agenda');

function acharJdk() {
  const cands = [process.env.JAVA_HOME, '/home/box/jdk17'].filter(Boolean).map((h) => path.join(h, 'bin'));
  for (const b of cands) if (fs.existsSync(path.join(b, 'javac'))) return { javac: path.join(b, 'javac'), java: path.join(b, 'java') };
  try { execFileSync('javac', ['-version'], { stdio: 'ignore' }); return { javac: 'javac', java: 'java' }; } catch { return null; }
}
const jdk = acharJdk();
const t = jdk ? test : test.skip;

function aleatorio(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

t('Regra.java = logica.ts (próximo alarme, janela) e = agenda.ts (7 dias) em 3000 casos', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'regra-'));
  const raiz = path.join(__dirname, '..');
  execFileSync(jdk.javac, ['-d', dir, path.join(raiz, 'modules/plantinha-alarme/android/src/main/java/br/com/minanoideias/alarme/Regra.java'), path.join(raiz, 'scripts/regra-java/Comparar.java')]);
  const r = aleatorio(42);
  const base = Date.parse('2026-10-26T00:00:00-03:00');
  const hora = () => String(Math.floor(r() * 24)).padStart(2, '0') + ':' + ['00', '15', '30', '45', '07'][Math.floor(r() * 5)];
  const casos = [];
  for (let i = 0; i < 3000; i++) {
    const agora = base + Math.floor(r() * 30 * 86400000);
    const ou0 = (p, max) => (r() < p ? 0 : agora - Math.floor(r() * max));
    const d = {
      ligado: r() < 0.9, intervalo: L.INTERVALOS[Math.floor(r() * L.INTERVALOS.length)],
      inicio: i % 50 === 0 ? 'xx' : hora(), fim: i % 77 === 0 ? '' : hora(),
      ligadoEm: ou0(0.1, 3 * 86400000), ultimoToque: ou0(0.3, 2 * 86400000),
      soneca: r() < 0.2 ? agora + Math.floor((r() - 0.3) * 1200000) : 0,
    };
    const ug = ou0(0.3, 86400000);
    casos.push({ d, ug, agora });
  }
  const entrada = casos.map(({ d, ug, agora }) => [d.ligado ? 1 : 0, d.intervalo, d.inicio, d.fim, d.ligadoEm, d.ultimoToque, d.soneca, ug, agora].join(';')).join('\n') + '\n';
  const saida = execFileSync(jdk.java, ['-cp', dir, 'Comparar'], { input: entrada, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, TZ: 'UTC' } }).trim().split('\n');
  expect(saida.length).toBe(casos.length);
  let difs = 0, comLista = 0;
  casos.forEach(({ d, ug, agora }, i) => {
    const dj = { ...d, ligadoEm: d.ligadoEm || null, ultimoToque: d.ultimoToque || null, soneca: d.soneca || null };
    const p = L.proximoAlarme({ ...dj }, ug || null, agora);
    const lista = A.horariosLembretes({ ...dj }, ug || null, agora);
    const esperado = (p === null ? -1 : p) + '|' + (L.naJanela(dj, agora) ? 1 : 0) + '|' + lista.map((x) => x + ',').join('');
    if (lista.length) comLista++;
    if (saida[i] !== esperado) { difs++; if (difs < 4) console.log('diferença', JSON.stringify(casos[i]), saida[i], esperado); }
  });
  expect(difs).toBe(0);
  expect(comLista).toBeGreaterThan(2000);
}, 60000);
