// Eventos do alarme nativo (src/logica/eventos.ts): "Já bebi" e "Daqui a pouco" tocados com o app fechado.
const L = require('../src/logica/jogo');
const E = require('../src/logica/eventos');
const sp = (dia, h) => Date.parse(dia + 'T' + h + ':00-03:00');
const D = '2026-10-26', D2 = '2026-10-27';
const desp = (o) => Object.assign(L.novoDesp(), { ligado: true, ligadoEm: sp(D, '08:00') }, o);
const salvo = (o) => JSON.stringify(Object.assign(L.novoEstado(sp(D, '08:00')), o));

describe('lerEventos', () => {
  test('JSON válido, em ordem de horário', () => {
    const l = E.lerEventos(JSON.stringify([{ tipo: 'bebi', t: 30 }, { tipo: 'toque', t: 10 }]));
    expect(l).toEqual([{ tipo: 'toque', t: 10 }, { tipo: 'bebi', t: 30 }]);
  });
  test('lixo vira lista vazia ou é ignorado', () => {
    expect(E.lerEventos(null)).toEqual([]);
    expect(E.lerEventos('{')).toEqual([]);
    expect(E.lerEventos('{"a":1}')).toEqual([]);
    expect(E.lerEventos(JSON.stringify([{ tipo: 'x', t: 1 }, { tipo: 'bebi' }, null, { tipo: 'bebi', t: 5 }]))).toEqual([{ tipo: 'bebi', t: 5 }]);
  });
});

describe('aplicarEventos', () => {
  test('toque + Já bebi: conta 1 copo na hora do toque, marca o toque e tira a soneca', () => {
    const e = L.carregar(salvo({ copos: 2, dia: D }), sp(D, '10:00'));
    const d = desp({ soneca: sp(D, '09:50') });
    const r = E.aplicarEventos(e, d, [{ tipo: 'toque', t: sp(D, '10:00') }, { tipo: 'bebi', t: sp(D, '10:01') }]);
    expect(r.copos).toBe(1);
    expect(e.copos).toBe(3);
    expect(e.ultimoGole).toBe(sp(D, '10:01'));
    expect(e.historico[D].copos).toBe(3);
    expect(d.ultimoToque).toBe(sp(D, '10:00'));
    expect(d.soneca).toBeNull();
    // próximo alarme conta do copo (igual ao botão do app)
    expect(L.hhmm(L.proximoAlarme(d, e.ultimoGole, sp(D, '10:02')))).toBe('11:31');
  });
  test('Daqui a pouco: soneca de 10 min, nenhum copo', () => {
    const e = L.carregar(salvo({ dia: D }), sp(D, '10:00'));
    const d = desp();
    const r = E.aplicarEventos(e, d, [{ tipo: 'toque', t: sp(D, '10:00') }, { tipo: 'soneca', t: sp(D, '10:00') + 20000 }]);
    expect(r.copos).toBe(0);
    expect(e.copos).toBe(0);
    expect(d.soneca).toBe(sp(D, '10:10') + 20000);
    expect(L.proximoAlarme(d, e.ultimoGole, sp(D, '10:01'))).toBe(sp(D, '10:10') + 20000);
  });
  test('soneca e depois Já bebi: a soneca acaba', () => {
    const e = L.carregar(salvo({ dia: D }), sp(D, '10:00'));
    const d = desp();
    E.aplicarEventos(e, d, [{ tipo: 'soneca', t: sp(D, '10:00') }, { tipo: 'toque', t: sp(D, '10:10') }, { tipo: 'bebi', t: sp(D, '10:11') }]);
    expect(d.soneca).toBeNull();
    expect(e.copos).toBe(1);
  });
  test('bater a meta pelo alarme conta para a sequência', () => {
    const e = L.carregar(salvo({ dia: D, copos: 7, meta: 8, sequencia: 2, ultimoDiaMeta: '2026-10-25' }), sp(D, '15:00'));
    const r = E.aplicarEventos(e, desp(), [{ tipo: 'bebi', t: sp(D, '15:00') }]);
    expect(r.resultados).toEqual(['bateu']);
    expect(e.sequencia).toBe(3);
  });
  test('copo de um dia que já passou só soma no histórico daquele dia', () => {
    const e = L.carregar(salvo({ dia: D2, copos: 1, historico: { [D]: { copos: 4, meta: 8, ml: 1000 } } }), sp(D2, '09:00'));
    E.aplicarEventos(e, desp(), [{ tipo: 'bebi', t: sp(D, '19:00') }]);
    expect(e.copos).toBe(1);
    expect(e.historico[D]).toEqual({ copos: 5, meta: 8, ml: 1250 });
  });
});

describe('carregarComEventos (abrir o app depois do alarme)', () => {
  test('Já bebi às 19:30 e o app só abre no dia seguinte: copo vai para ontem e o dia vira', () => {
    const texto = salvo({ dia: D, copos: 7, meta: 8, sequencia: 4, ultimoDiaMeta: '2026-10-25', historico: { [D]: { copos: 7, meta: 8, ml: 1750 } } });
    const d = desp();
    const r = E.carregarComEventos(texto, d, [{ tipo: 'toque', t: sp(D, '19:30') }, { tipo: 'bebi', t: sp(D, '19:31') }], sp(D2, '07:00'));
    expect(r.copos).toBe(1);
    expect(r.est.dia).toBe(D2);
    expect(r.est.copos).toBe(0);
    expect(r.est.historico[D].copos).toBe(8);
    expect(r.est.sequencia).toBe(5); // meta batida ontem pelo alarme mantém a sequência
    expect(L.sequenciaVisivel(r.est)).toBe(5);
    expect(d.ultimoToque).toBe(sp(D, '19:30'));
  });
  test('sem eventos = igual a carregar()', () => {
    const texto = salvo({ dia: D, copos: 3 });
    const r = E.carregarComEventos(texto, desp(), [], sp(D, '12:00'));
    expect(r.est).toEqual(L.carregar(texto, sp(D, '12:00')));
    expect(r.copos).toBe(0);
  });
  test('sem dados salvos (1º uso) e um Já bebi', () => {
    const r = E.carregarComEventos(null, desp(), [{ tipo: 'bebi', t: sp(D, '10:00') }], sp(D, '10:05'));
    expect(r.est.copos).toBe(1);
    expect(r.est.dia).toBe(D);
  });
  test('evento mais antigo que o dia salvo não volta o dia para trás', () => {
    const texto = salvo({ dia: D2, copos: 2, historico: { [D2]: { copos: 2, meta: 8, ml: 500 } } });
    const r = E.carregarComEventos(texto, desp(), [{ tipo: 'bebi', t: sp(D, '19:00') }, { tipo: 'bebi', t: sp(D2, '10:00') }], sp(D2, '10:05'));
    expect(r.est.dia).toBe(D2);
    expect(r.est.copos).toBe(3);
    expect(r.est.historico[D].copos).toBe(1);
  });
});
