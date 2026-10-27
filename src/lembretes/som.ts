// Som do despertador: a melodia do PWA (assets/alarme.wav, gerado por scripts/gerar-som.py),
// tocada a cada 2 s por ~10 s, com vibração. Qualquer botão para o som (ver src/componentes/Botao.tsx).
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { vibrar } from './vibrar';

let player: AudioPlayer | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function tocador(): AudioPlayer | null {
  try {
    if (!player) {
      setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'duckOthers' }).catch(() => {});
      player = createAudioPlayer(require('../../assets/alarme.wav'));
    }
    return player;
  } catch { return null; }
}
/** Prepara o som num toque do usuário (navegadores só liberam áudio depois de um gesto). */
export function prepararSom(): void { tocador(); }

function melodia(): void {
  const p = tocador(); if (!p) return;
  try { p.seekTo(0).catch(() => {}); p.play(); } catch { /* sem áudio */ }
}
export function somTocando(): boolean { return timer !== null; }
export function pararSom(): void {
  if (timer) { clearInterval(timer); timer = null; vibrar(0); }
  try { player?.pause(); } catch { /* nada */ }
}
export function tocarSom(): void {
  pararSom();
  let n = 0;
  melodia(); vibrar([400, 200, 400, 200, 800]);
  timer = setInterval(() => {
    if (++n >= 5) { pararSom(); return; }
    melodia(); vibrar([400, 200, 400]);
  }, 2000);
}
