// Android/iOS: avisos LOCAIS no próprio celular. Não é push (sem servidor).
// ANDROID (APK): alarme nativo (modules/plantinha-alarme): toca EM LOOP como despertador, abre sobre a
//   tela bloqueada e só para com "Já bebi" ou "Daqui a pouco". Agenda 1 alarme exato por vez com a mesma
//   regra do app e reagenda sozinho (depois de tocar, de responder e de reiniciar o celular).
// iOS / sem o módulo: notificações do expo-notifications com TODOS os lembretes dos próximos dias (src/logica/agenda.ts).
import { Alert, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Nativo } from './alarmeNativo';
import { lerEventos } from '../logica/eventos';
import type { Despertador, Evento, Perm } from '../tipos';

export const AVISA_FECHADO = true;
/** Android com o alarme nativo: quem toca é o celular (o alarme dentro do app não dispara, para não tocar 2 vezes). */
export const ALARME_NATIVO = Platform.OS === 'android' && !!Nativo;
const CANAL = 'lembrete-agua'; // canal novo (o som de um canal Android não muda depois de criado)
const SOM = 'alarme.wav'; // copiado para res/raw pelo plugin `sounds` do expo-notifications (app.json)
const PREFIXO = 'lembrete-';
const TITULO = 'Plantinha Sedenta 🌱';
const TEXTO = '💧 Hora de beber água! A plantinha está esperando.';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const aberto = AppState.currentState === 'active';
    return { shouldShowBanner: !aberto, shouldShowList: true, shouldPlaySound: !aberto, shouldSetBadge: false };
  },
});
let canalPronto: Promise<unknown> | null = null;
function canal(): Promise<unknown> {
  if (Platform.OS !== 'android' || ALARME_NATIVO) return Promise.resolve(); // alarme nativo cria os próprios canais
  return (canalPronto ??= Promise.all([
    Notifications.deleteNotificationChannelAsync('despertador').catch(() => null), // canal antigo, sem som próprio
    Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Lembrete de beber água',
      description: 'Toca no horário do despertador da plantinha, mesmo com o app fechado.',
      importance: Notifications.AndroidImportance.MAX,
      sound: SOM,
      enableVibrate: true,
      vibrationPattern: [0, 400, 200, 400, 200, 800],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: false,
    }),
  ]).catch(() => null));
}
function traduz(s: { granted: boolean; canAskAgain?: boolean }): Perm {
  return s.granted ? 'granted' : s.canAskAgain === false ? 'denied' : 'default';
}
export async function permissao(): Promise<Perm> {
  try { return traduz(await Notifications.getPermissionsAsync()); } catch { return 'indisponivel'; }
}
export async function pedirPermissao(): Promise<Perm> {
  try { await canal(); return traduz(await Notifications.requestPermissionsAsync()); } catch { return 'indisponivel'; }
}

/** Alarme exato (Android 12+). Sem ele o Android pode atrasar o aviso. */
export async function alarmeExato(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try { return (await Notifications.getExactAlarmPermissionsAsync()).granted; } catch { return true; }
}
/** Explica em português e abre a tela "Alarmes e lembretes" do Android. Resolve true se ficou permitido. */
export function pedirAlarmeExato(): Promise<boolean> {
  return alarmeExato().then((ok) => ok || new Promise<boolean>((fim) => {
    Alert.alert(
      'Permitir alarmes ⏰',
      'Para o lembrete tocar na hora certa com o app fechado, ative "Permitir alarmes e lembretes" na próxima tela e depois volte para o app.',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => fim(false) },
        { text: 'Abrir', onPress: () => { Notifications.requestExactAlarmPermissionsAsync().then((r) => fim(r.granted)).catch(() => fim(false)); } },
      ],
      { cancelable: true, onDismiss: () => fim(false) },
    );
  }));
}

/** Com o app aberto não precisa: a tela de alarme e a mensagem já avisam. */
export function notificar(_texto: string, _alarme?: boolean): void { /* nada */ }

function conteudo(corpo: string): Notifications.NotificationContentInput {
  return { title: TITULO, body: corpo, sound: SOM, priority: Notifications.AndroidNotificationPriority.MAX, vibrate: [0, 400, 200, 400, 200, 800], data: { tipo: 'lembrete' } };
}
function gatilho(quando: number): Notifications.NotificationTriggerInput {
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(quando), channelId: CANAL, delivery: 'alarmClock' };
}

let fila: Promise<unknown> = Promise.resolve();
/** Troca a agenda inteira pelos horários de `lista` (ms). Lista vazia = cancela tudo (despertador desligado). */
export function agendarLembretes(lista: number[]): void {
  if (ALARME_NATIVO) return; // no Android quem agenda é o alarme nativo (sincronizarAlarme)
  const copia = lista.slice();
  fila = fila.then(async () => {
    try {
      const todos = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(todos.filter((n) => n.identifier.startsWith(PREFIXO))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => null)));
      if (!copia.length || (await permissao()) !== 'granted') return;
      await canal();
      for (const t of copia) {
        if (t <= Date.now() + 5000) continue;
        await Notifications.scheduleNotificationAsync({ identifier: PREFIXO + t, content: conteudo(TEXTO), trigger: gatilho(t) });
      }
    } catch { /* sem notificações: o alarme dentro do app continua valendo */ }
  });
}

/** Um lembrete de teste daqui a `segundos` (não mexe na agenda normal). Devolve o horário ou null. */
export async function testarLembrete(segundos: number): Promise<number | null> {
  try {
    let p = await permissao();
    if (p === 'default') p = await pedirPermissao();
    if (p !== 'granted') return null;
    if (ALARME_NATIVO && Nativo) { await limparAntigos(); return Nativo.testar(segundos); }
    await canal();
    const quando = Date.now() + segundos * 1000;
    await Notifications.scheduleNotificationAsync({ identifier: 'teste-' + quando, content: conteudo('🧪 Teste: ' + TEXTO), trigger: gatilho(quando) });
    return quando;
  } catch { return null; }
}
export function registrarServiceWorker(): void { /* só na web */ }

/* ===== Alarme nativo (Android) ===== */
let limpou: Promise<unknown> | null = null;
/** Uma vez por abertura: apaga os avisos do APK anterior (expo-notifications) para não tocar 2 vezes. */
function limparAntigos(): Promise<unknown> {
  return (limpou ??= (async () => {
    try {
      const todos = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(todos.filter((n) => n.identifier.startsWith(PREFIXO) || n.identifier.startsWith('teste-'))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => null)));
      await Notifications.deleteNotificationChannelAsync(CANAL).catch(() => null);
      await Notifications.deleteNotificationChannelAsync('despertador').catch(() => null);
    } catch { /* nada a limpar */ }
  })());
}

/** Manda para o alarme nativo o despertador atual e o último copo (ele calcula e agenda o próximo). */
export function sincronizarAlarme(d: Despertador, ultimoGole: number | null): number | null {
  if (!ALARME_NATIVO || !Nativo) return null;
  limparAntigos();
  try {
    const p = Nativo.configurar(JSON.stringify({
      ligado: !!d.ligado, intervalo: d.intervalo, inicio: d.inicio, fim: d.fim,
      ligadoEm: d.ligadoEm || 0, ultimoToque: d.ultimoToque || 0, soneca: d.soneca || 0, ultimoGole: ultimoGole || 0,
    }));
    return p >= 0 ? p : null;
  } catch { return null; }
}

/** Eventos gravados pelo alarme com o app fechado ("toque", "bebi", "soneca"). */
export function eventosAlarme(): Evento[] {
  if (!ALARME_NATIVO || !Nativo) return [];
  try { return lerEventos(Nativo.eventos()); } catch { return []; }
}
/** Depois de salvar no app: apaga os eventos já aplicados (até o horário `ate`). */
export function apagarEventosAlarme(ate: number): void {
  if (!ALARME_NATIVO || !Nativo) return;
  try { Nativo.apagarEventos(ate); } catch { /* tenta de novo na próxima */ }
}

/** O alarme nativo está tocando agora (esperando resposta)? */
export function alarmeTocando(): boolean {
  if (!ALARME_NATIVO || !Nativo) return false;
  try { return Nativo.tocando() !== 0; } catch { return false; }
}
/** Para o alarme nativo pelo app: true = Já bebi (grava o evento do copo), false = Daqui a pouco. */
export function responderAlarme(bebi: boolean): void {
  if (!ALARME_NATIVO || !Nativo) return;
  try { Nativo.responder(bebi); } catch { /* nada */ }
}

/** Android 14+: permissão de abrir o alarme em tela cheia. */
export async function telaCheia(): Promise<boolean> {
  if (!ALARME_NATIVO || !Nativo) return true;
  try { return Nativo.telaCheiaPermitida(); } catch { return true; }
}
export function pedirTelaCheia(): Promise<boolean> {
  return telaCheia().then((ok) => ok || new Promise<boolean>((fim) => {
    Alert.alert(
      'Alarme em tela cheia 📱',
      'Para o alarme acender a tela e aparecer por cima da tela bloqueada, ative a permissão de tela cheia na próxima tela e depois volte para o app.',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => fim(false) },
        { text: 'Abrir', onPress: () => { try { Nativo?.pedirTelaCheia(); } catch { /* sem tela */ } fim(false); } },
      ],
      { cancelable: true, onDismiss: () => fim(false) },
    );
  }));
}
