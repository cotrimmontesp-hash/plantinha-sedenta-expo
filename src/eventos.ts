// Eventos que o ALARME NATIVO do Android (modules/plantinha-alarme) grava enquanto o app está fechado:
// 'toque' (o alarme tocou), 'bebi' (Paulo tocou "Já bebi") e 'soneca' (tocou "Daqui a pouco").
// Quando o app abre (ou a cada 15 s com ele aberto), estas funções puras aplicam os eventos
// com a MESMA lógica do app (src/logica.ts): beber() conta o copo na hora em que ele foi tomado.
import * as L from './logica';

export type TipoEvento = 'toque' | 'bebi' | 'soneca';
export interface Evento { tipo: TipoEvento; t: number }

/** Lê a lista que vem do lado nativo (JSON). Ignora lixo e devolve em ordem de horário. */
export function lerEventos(texto: string | null | undefined): Evento[] {
  let a: unknown = null;
  try { a = JSON.parse(String(texto)); } catch { a = null; }
  if (!Array.isArray(a)) return [];
  return a
    .filter((x): x is Evento => !!x && typeof x === 'object' && ['toque', 'bebi', 'soneca'].indexOf((x as Evento).tipo) >= 0 && typeof (x as Evento).t === 'number' && (x as Evento).t > 0)
    .map((x) => ({ tipo: x.tipo, t: x.t }))
    .sort((a1, b1) => a1.t - b1.t);
}

export interface Aplicado { copos: number; resultados: L.Resultado[]; ultimo: TipoEvento | null }

/** Copo de um dia que já passou (o estado já virou o dia): só soma no histórico daquele dia. */
function beberDiaPassado(e: L.Estado, t: number): void {
  const dia = L.diaDe(t);
  const h = e.historico || (e.historico = {});
  const r = h[dia] || { copos: 0, meta: e.meta, ml: 0 };
  r.copos += 1; r.ml = r.copos * e.copoMl;
  h[dia] = r;
  if (!e.ultimoGole || t > e.ultimoGole) e.ultimoGole = t;
  Object.keys(h).sort().slice(0, -30).forEach((k) => { delete h[k]; });
}

/** Aplica os eventos (em ordem) no estado e no despertador. Não salva nada. */
export function aplicarEventos(e: L.Estado, d: L.Despertador, eventos: Evento[]): Aplicado {
  const res: Aplicado = { copos: 0, resultados: [], ultimo: null };
  for (const ev of eventos.slice().sort((a, b) => a.t - b.t)) {
    if (ev.tipo === 'toque') L.marcarToque(d, ev.t);
    else if (ev.tipo === 'soneca') L.soneca(d, ev.t);
    else {
      if (L.diaDe(ev.t) < e.dia) beberDiaPassado(e, ev.t);
      else res.resultados.push(L.beber(e, ev.t)); // igual ao botão "Bebi um copo"
      d.soneca = null;
      res.copos += 1;
    }
    res.ultimo = ev.tipo;
  }
  return res;
}

/**
 * Carrega o estado salvo (JSON do app) já com os eventos do alarme aplicados, e só depois vira o dia.
 * Assim um "Já bebi" às 23h50 conta para o dia certo (meta e sequência daquele dia).
 */
export function carregarComEventos(texto: string | null | undefined, d: L.Despertador, eventos: Evento[], agora: number): { est: L.Estado } & Aplicado {
  let diaSalvo: string | null = null;
  try { const o = JSON.parse(String(texto)); if (o && typeof o.dia === 'string') diaSalvo = o.dia; } catch { /* sem dados */ }
  const primeiro = eventos.length ? Math.min(...eventos.map((x) => x.t)) : agora;
  // base: o horário do 1º evento, se ele não for de um dia anterior ao salvo (virarDia só deve andar para frente)
  const base = primeiro < agora && (!diaSalvo || L.diaDe(primeiro) >= diaSalvo) ? primeiro : agora;
  const est = L.carregar(texto, base);
  const r = aplicarEventos(est, d, eventos);
  L.virarDia(est, agora);
  return { est, ...r };
}
