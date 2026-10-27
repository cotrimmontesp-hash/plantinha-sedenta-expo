// Android/iOS: notificações LOCAIS agendadas no próprio celular (expo-notifications). Não é push (sem servidor).
// Agenda TODOS os lembretes dos próximos dias (lista vinda de src/agenda.ts), não só o próximo,
// para tocar com o app fechado e a tela apagada. No Android usa alarme exato (setAlarmClock).
// Depois de reiniciar o celular, o próprio expo-notifications reagenda (BOOT_COMPLETED).
import { Alert, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type Perm = 'granted' | 'denied' | 'default' | 'indisponivel';
export const AVISA_FECHADO = true;
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
  if (Platform.OS !== 'android') return Promise.resolve();
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
    await canal();
    const quando = Date.now() + segundos * 1000;
    await Notifications.scheduleNotificationAsync({ identifier: 'teste-' + quando, content: conteudo('🧪 Teste: ' + TEXTO), trigger: gatilho(quando) });
    return quando;
  } catch { return null; }
}
export function registrarServiceWorker(): void { /* só na web */ }
