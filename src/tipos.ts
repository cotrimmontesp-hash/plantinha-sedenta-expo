// Tipos do app num lugar só. Os módulos de lógica reexportam estes tipos (ex.: L.Estado continua valendo).
// Só tipos: nada aqui roda no app.

/* ===== Jogo (src/logica/jogo.ts) — mesmas estruturas JSON do PWA v5 ===== */
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

/* ===== Eventos do alarme nativo (src/logica/eventos.ts) ===== */
/** 'toque' (o alarme tocou), 'bebi' ("Já bebi") e 'soneca' ("Daqui a pouco"), gravados com o app fechado. */
export type TipoEvento = 'toque' | 'bebi' | 'soneca';
export interface Evento { tipo: TipoEvento; t: number }
/** O que aplicar os eventos fez: copos contados, resultado de cada copo e o último tipo de evento. */
export interface Aplicado { copos: number; resultados: Resultado[]; ultimo: TipoEvento | null }

/* ===== Armazenamento (src/dados/armazenamento.ts) ===== */
export interface Dados { est: Estado; desp: Despertador; ganhas: Medalhas; alarme: Aplicado }

/* ===== Lembretes (src/lembretes/) ===== */
/** Estado da permissão de notificações. */
export type Perm = 'granted' | 'denied' | 'default' | 'indisponivel';

/** Funções do módulo nativo Android `PlantinhaAlarme` (modules/plantinha-alarme, PlantinhaAlarmeModule.kt). */
export interface ModuloAlarme {
  configurar(json: string): number;
  testar(segundos: number): number;
  eventos(): string;
  apagarEventos(ate: number): void;
  tocando(): number;
  responder(bebi: boolean): void;
  proximo(): number;
  telaCheiaPermitida(): boolean;
  pedirTelaCheia(): boolean;
}
