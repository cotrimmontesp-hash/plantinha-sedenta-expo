// Persistência com AsyncStorage, com as MESMAS chaves e estruturas JSON do PWA (localStorage).
// Na web o AsyncStorage usa o localStorage do navegador.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as L from './logica';

export const CHAVE = 'plantinhaSedenta.v1';
export const CHAVE_D = 'plantinhaSedenta.despertador';
export const CHAVE_M = 'plantinhaSedenta.medalhas';

export interface Dados { est: L.Estado; desp: L.Despertador; ganhas: L.Medalhas }

export async function carregarTudo(agora: number): Promise<Dados> {
  let e: string | null = null, d: string | null = null, m: string | null = null;
  try { [e, d, m] = (await AsyncStorage.multiGet([CHAVE, CHAVE_D, CHAVE_M])).map((x) => x[1]); } catch { /* sem armazenamento: começa do zero */ }
  return { est: L.carregar(e, agora), desp: L.carregarDesp(d), ganhas: L.carregarMedalhas(m) };
}

function gravar(chave: string, valor: unknown): void {
  AsyncStorage.setItem(chave, JSON.stringify(valor)).catch(() => { /* ignora, como o PWA */ });
}
export const salvarEstado = (e: L.Estado) => gravar(CHAVE, e);
export const salvarDesp = (d: L.Despertador) => gravar(CHAVE_D, d);
export const salvarMedalhas = (m: L.Medalhas) => gravar(CHAVE_M, m);
