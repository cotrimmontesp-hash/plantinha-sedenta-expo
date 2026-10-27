/* ===== Lógica pura (portada do PWA v5, objeto `Logica`) =====
 * Sem React, sem armazenamento: só funções sobre os dados. Testada em __tests__/.
 * Datas e horas sempre em America/Sao_Paulo.
 */

export type Dia = string; // 'AAAA-MM-DD'

export interface RegistroDia { copos: number; meta: number; ml: number }

export interface Estado {
  v: number;
  dia: Dia;
  copos: number;
  meta: number;
  copoMl: number;
  sequencia: number;
  ultimoDiaMeta: Dia | null;
  seqAntes: number;
  diaMetaAntes: Dia | null;
  ultimoGole: number | null;
  historico: Record<Dia, RegistroDia>;
}

export interface Despertador {
  ligado: boolean;
  intervalo: number; // minutos
  inicio: string; // 'HH:MM'
  fim: string; // 'HH:MM'
  ligadoEm: number | null;
  ultimoToque: number | null;
  soneca: number | null;
}

export type IdMedalha = 'gole' | 'flor' | 'seq3' | 'seq7' | 'perfeita' | 'desp';
export type Medalhas = Partial<Record<IdMedalha, Dia>>;
export interface Medalha { id: IdMedalha; em: string; nome: string; como: string }

export interface DiaSemana { dia: Dia; letra: string; reg: RegistroDia | null; hoje: boolean; bateu: boolean }
export type Semana = DiaSemana[] & { bateu: number; com: number; media: number };

export type Resultado = 'bateu' | 'perdeu' | null;

export const ML_POR_COPO = 250;
export const COPOS_ML = [200, 250, 300, 500];
export const META_PADRAO = 8;
export const MIN_SEDE = 90;
export const META_MIN = 1;
export const META_MAX = 20;
export const INTERVALOS = [30, 45, 60, 90, 120];

let fmt: Intl.DateTimeFormat | null = null;
try { fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }); } catch { fmt = null; }
let fmtH: Intl.DateTimeFormat | null = null;
try { fmtH = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch { fmtH = null; }

const p2 = (n: number) => (n < 10 ? '0' : '') + n;

export function diaDe(ms: number): Dia {
  if (fmt) return fmt.format(new Date(ms)); // AAAA-MM-DD
  const d = new Date(ms);
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
}

export function diaAnterior(dia: Dia): Dia {
  const d = new Date(dia + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function novoEstado(agora: number): Estado {
  return { v: 1, dia: diaDe(agora), copos: 0, meta: META_PADRAO, copoMl: ML_POR_COPO, sequencia: 0,
    ultimoDiaMeta: null, seqAntes: 0, diaMetaAntes: null, ultimoGole: null, historico: {} };
}

function ehObjeto(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

export function limitarCopo(ml: unknown): number {
  const n = parseInt(String(ml), 10);
  return COPOS_ML.indexOf(n) >= 0 ? n : ML_POR_COPO; // sem campo (versão antiga) => 250
}

export function limitarMeta(m: unknown): number {
  let n = parseInt(String(m), 10);
  if (!(n >= META_MIN)) n = META_PADRAO;
  return Math.min(META_MAX, Math.max(META_MIN, n));
}

export function litros(ml: number): string {
  const l = +(ml / 1000).toFixed(2);
  return String(l).replace('.', ',') + (l === 1 ? ' litro' : ' litros');
}

/** Lê o JSON salvo (mesma estrutura do PWA, chave plantinhaSedenta.v1). */
export function carregar(texto: string | null | undefined, agora: number): Estado {
  let e: unknown = null;
  try { e = JSON.parse(String(texto)); } catch { e = null; }
  const base = novoEstado(agora);
  if (!e || typeof e !== 'object') return base;
  const r = e as Record<string, unknown>;
  for (const k of Object.keys(base) as (keyof Estado)[]) if (!(k in r)) r[k] = base[k];
  const est = r as unknown as Estado;
  est.copos = Math.max(0, parseInt(String(est.copos), 10) || 0);
  est.meta = limitarMeta(est.meta);
  est.copoMl = limitarCopo(est.copoMl);
  if (!ehObjeto(est.historico)) est.historico = {}; // versão antiga => {}
  return virarDia(est, agora);
}

/** Histórico: {'AAAA-MM-DD': {copos, meta, ml}}, só os últimos 30 dias. */
export function registrar(e: Estado): void {
  const h = e.historico || (e.historico = {});
  h[e.dia] = { copos: e.copos, meta: e.meta, ml: e.copos * e.copoMl };
  Object.keys(h).sort().slice(0, -30).forEach((k) => { delete h[k]; });
}

/** Zera o dia à meia-noite (America/Sao_Paulo). Sequência quebra se ontem não bateu a meta. */
export function virarDia(e: Estado, agora: number): Estado {
  const hoje = diaDe(agora);
  if (e.dia !== hoje) {
    if (e.historico && e.historico[e.dia]) registrar(e); // guarda o dia que acabou antes de zerar
    e.dia = hoje; e.copos = 0;
    e.seqAntes = 0; e.diaMetaAntes = null;
    if (e.ultimoDiaMeta !== diaAnterior(hoje)) e.sequencia = 0;
  }
  return e;
}

/** 7 dias terminando em e.dia. */
export function semana(e: Estado): Semana {
  const r: DiaSemana[] = [];
  const L = 'DSTQQSS';
  let d = e.dia;
  for (let i = 0; i < 7; i++) {
    const x = (e.historico || {})[d];
    r.unshift({ dia: d, letra: L[new Date(d + 'T12:00:00Z').getUTCDay()], reg: x || null, hoje: i === 0, bateu: !!x && x.copos >= x.meta });
    d = diaAnterior(d);
  }
  const c = r.filter((o) => o.reg);
  let soma = 0;
  c.forEach((o) => { soma += (o.reg as RegistroDia).ml; });
  const s = r as Semana;
  s.bateu = r.filter((o) => o.bateu).length;
  s.com = c.length;
  s.media = c.length ? Math.round(soma / c.length) : 0;
  return s;
}

export function bateuMeta(e: Estado): boolean { return e.copos >= e.meta; }

function reavaliarSequencia(e: Estado): Resultado {
  const hoje = e.dia;
  if (bateuMeta(e) && e.ultimoDiaMeta !== hoje) {
    e.seqAntes = e.sequencia; e.diaMetaAntes = e.ultimoDiaMeta;
    e.sequencia = e.ultimoDiaMeta === diaAnterior(hoje) ? e.sequencia + 1 : 1;
    e.ultimoDiaMeta = hoje;
    return 'bateu';
  }
  if (!bateuMeta(e) && e.ultimoDiaMeta === hoje) {
    e.sequencia = e.seqAntes; e.ultimoDiaMeta = e.diaMetaAntes;
    return 'perdeu';
  }
  return null;
}

export function beber(e: Estado, agora: number): Resultado {
  virarDia(e, agora);
  e.copos += 1; e.ultimoGole = agora;
  const r = reavaliarSequencia(e); registrar(e); return r;
}

export function desfazer(e: Estado, agora: number): boolean {
  virarDia(e, agora);
  if (e.copos <= 0) return false;
  e.copos -= 1;
  reavaliarSequencia(e); registrar(e);
  return true;
}

export function mudarMeta(e: Estado, meta: unknown, agora: number): Resultado {
  virarDia(e, agora);
  e.meta = limitarMeta(meta);
  const r = reavaliarSequencia(e); registrar(e); return r;
}

/** Estágios 0..5: 0 semente, 1 broto, 2-3 folhas, 4 botão, 5 flor (meta batida). */
export function estagio(e: Estado): number {
  if (e.copos <= 0) return 0;
  if (bateuMeta(e)) return 5;
  return Math.max(1, Math.min(4, Math.ceil((e.copos * 4) / e.meta)));
}

/** Sequência a exibir: se o último dia com meta foi antes de ontem, ela já quebrou. */
export function sequenciaVisivel(e: Estado): number {
  if (e.ultimoDiaMeta === e.dia || e.ultimoDiaMeta === diaAnterior(e.dia)) return e.sequencia;
  return 0;
}

/** Murcha se passaram 90 min desde o último copo (ou desde que o app abriu, o que for mais recente) e a meta não foi batida. */
export function estaMurcha(e: Estado, agora: number, abertura?: number | null): boolean {
  if (bateuMeta(e)) return false;
  const ref = Math.max(e.ultimoGole || 0, abertura || 0);
  return agora - ref >= MIN_SEDE * 60000;
}

/* ===== Despertador (horários em America/Sao_Paulo) ===== */
export function hhmm(ms: number): string {
  if (fmtH) return fmtH.format(new Date(ms)).slice(0, 5);
  const d = new Date(ms);
  return p2(d.getHours()) + ':' + p2(d.getMinutes());
}
function minDe(ms: number): number { const h = hhmm(ms).split(':'); return +h[0] * 60 + +h[1]; }
function minTxt(t: string | null | undefined, pad: number): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  return m ? Math.min(1439, +m[1] * 60 + +m[2]) : pad;
}

export function novoDesp(): Despertador {
  return { ligado: false, intervalo: 90, inicio: '08:00', fim: '20:00', ligadoEm: null, ultimoToque: null, soneca: null };
}

export function carregarDesp(texto: string | null | undefined): Despertador {
  let d: unknown = null;
  try { d = JSON.parse(String(texto)); } catch { d = null; }
  const b = novoDesp();
  if (!d || typeof d !== 'object') return b;
  const r = d as Record<string, unknown>;
  for (const k of Object.keys(b) as (keyof Despertador)[]) if (!(k in r)) r[k] = b[k];
  const x = r as unknown as Despertador;
  x.ligado = !!x.ligado;
  x.intervalo = INTERVALOS.indexOf(+x.intervalo) >= 0 ? +x.intervalo : 90;
  return x;
}

export function naJanela(d: Despertador, ms: number): boolean {
  const m = minDe(ms), a = minTxt(d.inicio, 480), b = minTxt(d.fim, 1200);
  return a <= b ? m >= a && m <= b : m >= a || m <= b;
}
function irParaJanela(d: Despertador, ms: number): number {
  if (naJanela(d, ms)) return ms;
  const falta = (minTxt(d.inicio, 480) - minDe(ms) + 1440) % 1440;
  return ms - (ms % 60000) + falta * 60000;
}

/** Próximo toque: soneca, ou intervalo contado do último copo / último toque / quando ligou. Fora da janela, vai para o início dela. */
export function proximoAlarme(d: Despertador, ultimoGole: number | null, agora: number): number | null {
  if (!d.ligado) return null;
  let alvo = d.soneca || Math.max(ultimoGole || 0, d.ultimoToque || 0, d.ligadoEm || 0) + d.intervalo * 60000;
  if (alvo < agora && !naJanela(d, agora)) alvo = agora;
  return irParaJanela(d, alvo);
}
export function deveTocar(d: Despertador, ultimoGole: number | null, agora: number): boolean {
  const p = proximoAlarme(d, ultimoGole, agora);
  return p !== null && agora >= p && naJanela(d, agora);
}
export function marcarToque(d: Despertador, agora: number): void { d.ultimoToque = agora; d.soneca = null; }
export function soneca(d: Despertador, agora: number): number { d.ultimoToque = agora; d.soneca = agora + 10 * 60000; return d.soneca; }

/* ===== Conquistas: {id: 'AAAA-MM-DD'} em plantinhaSedenta.medalhas ===== */
export const MEDALHAS: Medalha[] = [
  { id: 'gole', em: '💧', nome: 'Primeiro gole', como: 'Beba o 1º copo' },
  { id: 'flor', em: '🌸', nome: 'Flor aberta', como: 'Bata a meta 1 vez' },
  { id: 'seq3', em: '🔥', nome: '3 dias seguidos', como: 'Meta 3 dias seguidos' },
  { id: 'seq7', em: '🌟', nome: '7 dias seguidos', como: 'Meta 7 dias seguidos' },
  { id: 'perfeita', em: '🏆', nome: 'Semana perfeita', como: 'Meta nos 7 dias do gráfico' },
  { id: 'desp', em: '⏰', nome: 'Despertador amigo', como: 'Ligue o despertador e beba' },
];

export function carregarMedalhas(texto: string | null | undefined): Medalhas {
  let m: unknown = null;
  try { m = JSON.parse(String(texto)); } catch { m = null; }
  const r: Medalhas = {};
  if (!ehObjeto(m)) return r;
  MEDALHAS.forEach((x) => { const v = m[x.id]; if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) r[x.id] = v; });
  return r;
}

/** Ids das medalhas que valem agora e ainda não estão em `ganhas` (não altera nada). */
export function avaliarMedalhas(e: Estado, d?: Partial<Despertador> | null, _hoje?: Dia, ganhas?: Medalhas | null): IdMedalha[] {
  const g = ganhas || {}, dd = d || {};
  const h = e.historico || {}, dias = Object.keys(h), w = semana(e);
  const vale: Record<IdMedalha, boolean> = {
    gole: e.copos > 0 || !!e.ultimoGole || dias.some((k) => h[k].copos > 0),
    flor: bateuMeta(e) || !!e.ultimoDiaMeta || dias.some((k) => h[k].copos >= h[k].meta),
    seq3: e.sequencia >= 3,
    seq7: e.sequencia >= 7,
    perfeita: w.com === 7 && w.bateu === 7,
    desp: !!dd.ligado && !!e.ultimoGole && e.ultimoGole >= (dd.ligadoEm || 0),
  };
  return MEDALHAS.filter((x) => vale[x.id] && !g[x.id]).map((x) => x.id);
}

export function dataBR(dia: Dia): string {
  const p = String(dia).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '';
}
