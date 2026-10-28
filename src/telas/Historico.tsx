// Aba Histórico: últimos 7 dias (ml por dia) e a média.
import { Text, View } from 'react-native';
import * as L from '../logica/jogo';
import type { Plantinha } from '../estado/usePlantinha';
import Tela from '../componentes/Tela';
import { cor } from '../tema';
import { st } from './estilos';

export default function Historico({ p }: { p: Plantinha }) {
  const w = L.semana(p.est);
  return (
    <Tela titulo="📊 Histórico">
      <View style={st.painel} accessibilityLabel="Últimos 7 dias">
        <Text style={st.h2}>Últimos 7 dias <Text style={{ fontSize: 15, fontWeight: '400' }}>(ml)</Text></Text>
        <View testID="hist" style={[st.hist, st.histAlto]}>
          {w.map((o) => {
            const x = o.reg, h = x ? Math.round(Math.min(1, x.copos / x.meta) * 100) : 0;
            return (
              <View key={o.dia} style={st.histCol} accessibilityLabel={o.dia}>
                <Text style={[st.histTx, o.hoje && st.histHoje]}>{x ? x.ml : '–'}</Text>
                <View style={[st.histBarra, { height: Math.max(3, h * 2) }, { backgroundColor: !x ? cor.borda : o.bateu ? cor.verde : cor.agua }]} />
                <Text style={[st.histLetra, o.hoje && st.histHoje, o.hoje && st.histHojeB]}>{o.letra}</Text>
              </View>
            );
          })}
        </View>
        <Text testID="hResumo" style={st.resumo}>{w.com ? 'Bateu a meta em ' + w.bateu + ' de 7 dias · média ' + w.media + ' ml/dia' : 'Ainda sem histórico'}</Text>
        <Text style={st.aviso}>🟩 verde = bateu a meta · 🟦 azul = bebeu, sem bater · hoje em destaque</Text>
      </View>
    </Tela>
  );
}
