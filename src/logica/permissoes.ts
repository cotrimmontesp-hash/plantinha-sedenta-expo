// Botão único ⚠️ de Ajustes › Despertador: quais permissões do alarme faltam, o texto do botão
// e o pedido em sequência (a próxima só depois que a anterior responder). Funções puras (testes no Jest).

/** 'exato' = "Alarmes e lembretes" (Android 12+); 'telaCheia' = alarme em tela cheia (Android 14+). */
export type PermAlarme = 'exato' | 'telaCheia';

export interface SituacaoPerm {
  avisaFechado: boolean; // o app agenda o aviso com ele fechado (Android)
  alarmeNativo: boolean; // o alarme nativo em tela cheia existe (APK Android)
  ligado: boolean;       // despertador ligado
  exato: boolean;        // "Alarmes e lembretes" permitido
  telaOk: boolean;       // tela cheia permitida
}

/** Permissões que faltam, na ordem em que são pedidas (as mesmas condições dos 2 botões antigos). */
export function permissoesFaltando(s: SituacaoPerm): PermAlarme[] {
  if (!s.ligado) return [];
  const f: PermAlarme[] = [];
  if (s.avisaFechado && !s.exato) f.push('exato');
  if (s.alarmeNativo && !s.telaOk) f.push('telaCheia');
  return f;
}

/** Texto do botão único; null = nada falta (botão some). Com uma só, o mesmo texto do botão antigo. */
export function rotuloPermissoes(f: readonly PermAlarme[]): string | null {
  if (!f.length) return null;
  if (f.length > 1) return '⚠️ Permitir alarmes e tela cheia';
  return f[0] === 'exato' ? '⚠️ Permitir alarmes na hora certa' : '⚠️ Permitir alarme em tela cheia';
}

/**
 * Pede cada permissão de `f`, uma por vez: a próxima só começa depois que a anterior responder
 * (como já acontece ao ligar o despertador). Avisa cada resultado em `aoResponder`.
 */
export async function pedirEmSequencia(
  f: readonly PermAlarme[],
  pedir: Record<PermAlarme, () => Promise<boolean>>,
  aoResponder: (qual: PermAlarme, ok: boolean) => void,
): Promise<Partial<Record<PermAlarme, boolean>>> {
  const r: Partial<Record<PermAlarme, boolean>> = {};
  for (const q of f) {
    let ok = false;
    try { ok = await pedir[q](); } catch { ok = false; }
    r[q] = ok; aoResponder(q, ok);
  }
  return r;
}
