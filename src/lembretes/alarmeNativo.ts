// Ponte para o alarme nativo do Android (modules/plantinha-alarme). Fora do APK (web, Jest, Expo Go) fica null.
import { requireOptionalNativeModule } from 'expo';

import type { ModuloAlarme } from '../tipos';
export type { ModuloAlarme } from '../tipos';

let m: ModuloAlarme | null = null;
try { m = requireOptionalNativeModule<ModuloAlarme>('PlantinhaAlarme'); } catch { m = null; }
export const Nativo = m;
