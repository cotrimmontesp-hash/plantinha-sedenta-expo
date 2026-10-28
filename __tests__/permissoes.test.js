// Botão único ⚠️ de permissões em Ajustes (src/logica/permissoes.ts).
const P = require('../src/logica/permissoes');
const android = { avisaFechado: true, alarmeNativo: true, ligado: true, exato: true, telaOk: true };

test('faltam as duas: alarme na hora certa primeiro, depois tela cheia', () => {
  expect(P.permissoesFaltando({ ...android, exato: false, telaOk: false })).toEqual(['exato', 'telaCheia']);
});
test('falta só uma: o botão pede só essa', () => {
  expect(P.permissoesFaltando({ ...android, exato: false })).toEqual(['exato']);
  expect(P.permissoesFaltando({ ...android, telaOk: false })).toEqual(['telaCheia']);
});
test('nada falta, despertador desligado ou web: sem botão', () => {
  expect(P.permissoesFaltando(android)).toEqual([]);
  expect(P.permissoesFaltando({ ...android, ligado: false, exato: false, telaOk: false })).toEqual([]);
  expect(P.permissoesFaltando({ avisaFechado: false, alarmeNativo: false, ligado: true, exato: false, telaOk: false })).toEqual([]);
  expect(P.rotuloPermissoes([])).toBeNull();
});
test('mesmas condições dos 2 botões antigos (avisaFechado → exato, alarmeNativo → tela cheia)', () => {
  expect(P.permissoesFaltando({ ...android, alarmeNativo: false, exato: false, telaOk: false })).toEqual(['exato']);
  expect(P.permissoesFaltando({ ...android, avisaFechado: false, exato: false, telaOk: false })).toEqual(['telaCheia']);
});
test('texto em português: o das duas e os mesmos de antes para uma só', () => {
  expect(P.rotuloPermissoes(['exato', 'telaCheia'])).toBe('⚠️ Permitir alarmes e tela cheia');
  expect(P.rotuloPermissoes(['exato'])).toBe('⚠️ Permitir alarmes na hora certa');
  expect(P.rotuloPermissoes(['telaCheia'])).toBe('⚠️ Permitir alarme em tela cheia');
});
test('pede em sequência: a próxima só começa depois da anterior responder', async () => {
  const log = []; let solta;
  const pedir = {
    exato: () => { log.push('pede exato'); return new Promise((r) => { solta = r; }); },
    telaCheia: () => { log.push('pede tela'); return Promise.resolve(true); },
  };
  const fim = P.pedirEmSequencia(['exato', 'telaCheia'], pedir, (q, ok) => log.push(q + '=' + ok));
  await Promise.resolve(); await Promise.resolve();
  expect(log).toEqual(['pede exato']); // tela cheia ainda não foi pedida
  solta(false); // "Agora não" no primeiro: segue para o próximo, como ao ligar o despertador
  expect(await fim).toEqual({ exato: false, telaCheia: true });
  expect(log).toEqual(['pede exato', 'exato=false', 'pede tela', 'telaCheia=true']);
});
test('com uma só, pede só essa; erro conta como não permitido', async () => {
  const chamadas = [];
  const pedir = { exato: () => { chamadas.push('exato'); return Promise.resolve(true); }, telaCheia: () => { chamadas.push('tela'); return Promise.reject(new Error('x')); } };
  expect(await P.pedirEmSequencia(['telaCheia'], pedir, () => {})).toEqual({ telaCheia: false });
  expect(chamadas).toEqual(['tela']);
  expect(await P.pedirEmSequencia([], pedir, () => {})).toEqual({});
});
