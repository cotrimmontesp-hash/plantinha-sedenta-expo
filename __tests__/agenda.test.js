// Agenda de lembretes com o app fechado (src/agenda.ts). Horários em America/Sao_Paulo (UTC-3).
const L = require('../src/logica');
const A = require('../src/agenda');
const sp = (dia, h) => Date.parse(dia + 'T' + h + ':00-03:00');
const D = '2026-10-26';
const hh = (l) => l.map(L.hhmm);
const desp = (o) => Object.assign(L.novoDesp(), { ligado: true }, o);

describe('agenda de lembretes (app fechado)', () => {
  test('desligado => nenhum lembrete', () => {
    expect(A.horariosLembretes(L.novoDesp(), null, sp(D, '10:00'))).toEqual([]);
  });

  test('ligado 09:00, 90 min, 08–20: o resto do dia inteiro, não só o próximo', () => {
    const d = desp({ ligadoEm: sp(D, '09:00') });
    const l = A.horariosLembretes(d, null, sp(D, '09:00'), 1);
    const hoje = l.filter((t) => L.diaDe(t) === D);
    expect(hh(hoje)).toEqual(['10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30']);
  });

  test('fora da janela pula para o início do dia seguinte e continua', () => {
    const d = desp({ ligadoEm: sp(D, '09:00') });
    const l = A.horariosLembretes(d, null, sp(D, '09:00'), 2);
    const amanha = l.filter((t) => L.diaDe(t) === '2026-10-27');
    expect(hh(amanha).slice(0, 3)).toEqual(['08:00', '09:30', '11:00']);
    expect(l.every((t) => L.naJanela(d, t))).toBe(true);
  });

  test('cobre vários dias (7) dentro do teto', () => {
    const d = desp({ ligadoEm: sp(D, '09:00'), intervalo: 120 });
    const l = A.horariosLembretes(d, null, sp(D, '09:00'));
    const dias = new Set(l.map(L.diaDe));
    expect(dias.size).toBeGreaterThanOrEqual(7); // hoje + 7 dias à frente (o último só até a mesma hora)
    expect(l.length).toBeLessThanOrEqual(A.MAX_AGENDA);
    expect(l[l.length - 1]).toBeLessThanOrEqual(sp(D, '09:00') + 7 * 86400000);
  });

  test('em ordem crescente, sem repetidos, todos no futuro', () => {
    const agora = sp(D, '11:07');
    const l = A.horariosLembretes(desp({ ligadoEm: sp(D, '06:00'), intervalo: 30 }), null, agora);
    for (let i = 1; i < l.length; i++) expect(l[i]).toBeGreaterThan(l[i - 1]);
    expect(l[0]).toBeGreaterThan(agora + A.FOLGA_MS);
  });

  test('teto de itens respeitado (30 min, janela de 24 h)', () => {
    const d = desp({ ligadoEm: sp(D, '00:00'), intervalo: 30, inicio: '00:00', fim: '23:59' });
    expect(A.horariosLembretes(d, null, sp(D, '00:00')).length).toBe(A.MAX_AGENDA);
  });

  test('beber recalcula: copo às 10:00 empurra a fila para 11:30', () => {
    const d = desp({ ligadoEm: sp(D, '09:00') });
    expect(hh(A.horariosLembretes(d, sp(D, '10:00'), sp(D, '10:05'), 1)).slice(0, 3)).toEqual(['11:30', '13:00', '14:30']);
  });

  test('soneca: primeiro às 15:10, depois intervalo a partir dela', () => {
    const d = desp({ ligadoEm: sp(D, '09:00') });
    L.soneca(d, sp(D, '15:00'));
    expect(hh(A.horariosLembretes(d, null, sp(D, '15:00'), 1)).slice(0, 3)).toEqual(['15:10', '16:40', '18:10']);
    expect(d.soneca).toBe(sp(D, '15:10')); // não altera o despertador original
  });

  test('atrasado dentro da janela: o app toca agora, a fila começa depois do intervalo', () => {
    const d = desp({ ligadoEm: sp(D, '08:00') }); // vencido às 09:30
    expect(hh(A.horariosLembretes(d, null, sp(D, '12:00'), 1)).slice(0, 2)).toEqual(['13:30', '15:00']);
  });

  test('reaberto às 22:00 com alarme vencido: começa amanhã 08:00', () => {
    const d = desp({ ligadoEm: sp(D, '17:00') });
    const l = A.horariosLembretes(d, null, sp(D, '22:00'));
    expect(L.hhmm(l[0])).toBe('08:00');
    expect(L.diaDe(l[0])).toBe('2026-10-27');
  });

  test('primeiro da lista = próximo lembrete mostrado no app', () => {
    const d = desp({ ligadoEm: sp(D, '09:00'), intervalo: 45 });
    const agora = sp(D, '09:20');
    expect(A.horariosLembretes(d, sp(D, '09:10'), agora)[0]).toBe(L.proximoAlarme(d, sp(D, '09:10'), agora));
  });

  test('janela que passa da meia-noite (22:00–02:00)', () => {
    const d = desp({ ligadoEm: sp(D, '21:00'), inicio: '22:00', fim: '02:00', intervalo: 60 });
    const l = A.horariosLembretes(d, null, sp(D, '21:00'), 1);
    expect(hh(l)).toEqual(['22:00', '23:00', '00:00', '01:00', '02:00']);
  });

  test('assinatura muda quando a lista muda', () => {
    expect(A.assinatura([1, 2])).not.toBe(A.assinatura([1, 3]));
    expect(A.assinatura([])).toBe('0:0:0');
  });
});
