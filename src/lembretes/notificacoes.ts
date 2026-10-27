// Web (navegador): avisos com a Notification API, como no PWA. Sem push: só com o app aberto ou recém-fechado.
import type { Despertador, Evento, Perm } from '../tipos';

const TITULO = 'Plantinha Sedenta 🌱';

function temNotif(): boolean { return typeof window !== 'undefined' && 'Notification' in window; }

export async function permissao(): Promise<Perm> {
  if (!temNotif()) return 'indisponivel';
  return Notification.permission as Perm;
}
export async function pedirPermissao(): Promise<Perm> {
  if (!temNotif()) return 'indisponivel';
  try { return (await Notification.requestPermission()) as Perm; } catch { return Notification.permission as Perm; }
}
export function notificar(texto: string, alarme?: boolean): void {
  if (!temNotif() || Notification.permission !== 'granted') return;
  const op: NotificationOptions & Record<string, unknown> = { body: texto, tag: 'plantinha', icon: '/logo192.png' };
  if (alarme) Object.assign(op, { tag: 'plantinha-alarme', renotify: true, requireInteraction: true, vibrate: [400, 200, 400, 200, 800] });
  const direto = () => { try { new Notification(TITULO, op); } catch { /* Android exige service worker */ } };
  if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistration) {
    navigator.serviceWorker.getRegistration().then((reg) => (reg && reg.showNotification ? reg.showNotification(TITULO, op) : direto())).catch(direto);
  } else direto();
}
/** Na web não dá para agendar aviso com o app fechado (sem push). */
export const AVISA_FECHADO = false;
export function agendarLembretes(_lista: number[]): void { /* nada na web */ }
export async function alarmeExato(): Promise<boolean> { return true; }
export async function pedirAlarmeExato(): Promise<boolean> { return true; }
export async function testarLembrete(_segundos: number): Promise<number | null> { return null; }
/* Alarme nativo: só no APK Android. Na web nada muda. */
export const ALARME_NATIVO = false;
export function sincronizarAlarme(_d: Despertador, _ultimoGole: number | null): number | null { return null; }
export function eventosAlarme(): Evento[] { return []; }
export function apagarEventosAlarme(_ate: number): void { /* nada na web */ }
export function alarmeTocando(): boolean { return false; }
export function responderAlarme(_bebi: boolean): void { /* nada na web */ }
export async function telaCheia(): Promise<boolean> { return true; }
export async function pedirTelaCheia(): Promise<boolean> { return true; }
export function registrarServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || __DEV__) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {}); });
}
