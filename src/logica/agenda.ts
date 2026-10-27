// Lista de lembretes a agendar no celular (Android) para tocar com o app FECHADO.
// Função pura (sem tela, sem expo): recebe a config do despertador, o último copo e "agora".
// Segue a mesma regra do despertador dentro do app (proximoAlarme/marcarToque):
// cada lembrete conta como um toque, e o próximo vem `intervalo` minutos depois,
// pulando para o início da janela quando cair fora dela.
import { marcarToque, proximoAlarme, type Despertador } from './jogo';

export const DIAS_AGENDA = 7; // quantos dias para frente
export const MAX_AGENDA = 60; // teto de avisos agendados de uma vez (Android aceita até 500 alarmes por app)
export const FOLGA_MS = 5000; // não agenda nada para os próximos 5 s (o app aberto já avisa)

/** Horários (ms) de todos os lembretes futuros, em ordem, até `dias` dias ou `max` itens. Vazio se o despertador está desligado. */
export function horariosLembretes(
  d: Despertador,
  ultimoGole: number | null,
  agora: number,
  dias: number = DIAS_AGENDA,
  max: number = MAX_AGENDA,
): number[] {
  if (!d || !d.ligado) return [];
  const limite = agora + dias * 86400000;
  const sim: Despertador = { ...d }; // cópia: não mexe no despertador de verdade
  const lista: number[] = [];
  let cur = agora;
  for (let i = 0; i < 2000 && lista.length < max; i++) {
    let t = proximoAlarme(sim, ultimoGole, cur);
    if (t === null) break;
    if (t < cur) t = cur; // atrasado: o app aberto toca agora; o próximo conta a partir daqui
    if (t > limite) break;
    if (t > agora + FOLGA_MS) lista.push(t);
    marcarToque(sim, t);
    cur = t;
  }
  return lista;
}
