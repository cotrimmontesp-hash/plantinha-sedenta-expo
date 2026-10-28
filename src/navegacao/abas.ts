// As 4 abas fixas embaixo (proposta B aprovada pelo Paulo): nomes, emoji e ordem.
export type AbaId = 'hoje' | 'historico' | 'conquistas' | 'ajustes';

export type Aba = { id: AbaId; nome: string; em: string };

export const ABAS: readonly Aba[] = [
  { id: 'hoje', nome: 'Hoje', em: '💧' },
  { id: 'historico', nome: 'Histórico', em: '📊' },
  { id: 'conquistas', nome: 'Conquistas', em: '🏅' },
  { id: 'ajustes', nome: 'Ajustes', em: '⚙️' },
];

/** O app sempre abre em "Hoje" (a ação principal: beber um copo). */
export const ABA_INICIAL: AbaId = 'hoje';

export function abaValida(x: unknown): x is AbaId {
  return ABAS.some((a) => a.id === x);
}

/** Texto do leitor de tela para a aba: "Histórico, aba 2 de 4". */
export function rotuloAba(id: AbaId): string {
  const i = ABAS.findIndex((a) => a.id === id);
  return ABAS[i].nome + ', aba ' + (i + 1) + ' de ' + ABAS.length;
}
