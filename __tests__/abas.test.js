// Navegação por abas (src/navegacao/abas.ts): 4 abas fixas da proposta B, na ordem, com nome e emoji.
const A = require('../src/navegacao/abas');

test('4 abas na ordem da proposta B', () => {
  expect(A.ABAS.map((a) => a.id)).toEqual(['hoje', 'historico', 'conquistas', 'ajustes']);
  expect(A.ABAS.map((a) => a.nome)).toEqual(['Hoje', 'Histórico', 'Conquistas', 'Ajustes']);
  expect(A.ABAS.map((a) => a.em)).toEqual(['💧', '📊', '🏅', '⚙️']);
});
test('ids únicos e o app abre em Hoje', () => {
  expect(new Set(A.ABAS.map((a) => a.id)).size).toBe(4);
  expect(A.ABA_INICIAL).toBe('hoje');
});
test('abaValida aceita só as 4 abas', () => {
  for (const a of A.ABAS) expect(A.abaValida(a.id)).toBe(true);
  for (const x of ['', 'jogo', 'Hoje', null, undefined, 1]) expect(A.abaValida(x)).toBe(false);
});
test('rótulo do leitor de tela', () => {
  expect(A.rotuloAba('hoje')).toBe('Hoje, aba 1 de 4');
  expect(A.rotuloAba('ajustes')).toBe('Ajustes, aba 4 de 4');
});
