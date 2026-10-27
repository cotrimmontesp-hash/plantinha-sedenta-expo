// Ponte para o alarme nativo do Android (modules/plantinha-alarme). Fora do APK (web, Jest, Expo Go) fica null.
import { requireOptionalNativeModule } from 'expo';

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

let m: ModuloAlarme | null = null;
try { m = requireOptionalNativeModule<ModuloAlarme>('PlantinhaAlarme'); } catch { m = null; }
export const Nativo = m;
