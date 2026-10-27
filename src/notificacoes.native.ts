// Android/iOS: notificação LOCAL agendada (expo-notifications) para o próximo lembrete.
// Não é push (sem servidor): o app agenda no próprio celular. Com o app aberto, quem avisa é a tela de alarme.
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type Perm = 'granted' | 'denied' | 'default' | 'indisponivel';
const CANAL = 'despertador';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const aberto = AppState.currentState === 'active';
    return { shouldShowBanner: !aberto, shouldShowList: true, shouldPlaySound: !aberto, shouldSetBadge: false };
  },
});
let canalPronto: Promise<unknown> | null = null;
function canal(): Promise<unknown> {
  if (Platform.OS !== 'android') return Promise.resolve();
  return (canalPronto ??= Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Despertador da água',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400, 200, 800],
  }).catch(() => null));
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
/** Com o app aberto não precisa: a tela de alarme e a mensagem já avisam. */
export function notificar(_texto: string, _alarme?: boolean): void { /* nada */ }

let ultimo: number | null = -1;
/** Agenda (ou cancela) um único aviso para o horário do próximo lembrete. */
export function agendarLembrete(quando: number | null): void {
  if (quando === ultimo) return;
  ultimo = quando;
  (async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (quando === null || quando <= Date.now() + 5000) return;
      if ((await permissao()) !== 'granted') return;
      await canal();
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Plantinha Sedenta 🌱', body: '💧 Hora de beber água! A plantinha está esperando.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(quando), channelId: CANAL },
      });
    } catch { /* sem notificações: o alarme dentro do app continua valendo */ }
  })();
}
export function registrarServiceWorker(): void { /* só na web */ }
