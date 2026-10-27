import { Platform, Vibration } from 'react-native';

/** Padrão no formato do navigator.vibrate do PWA: [vibra, pausa, vibra, ...] ou um número (ms). 0 = parar. */
export function vibrar(p: number | number[]): void {
  try {
    if (p === 0) { Vibration.cancel(); return; }
    if (Array.isArray(p) && Platform.OS === 'android') Vibration.vibrate([0, ...p]); // no Android o 1º item é a espera
    else Vibration.vibrate(p);
  } catch { /* aparelho sem vibração */ }
}
