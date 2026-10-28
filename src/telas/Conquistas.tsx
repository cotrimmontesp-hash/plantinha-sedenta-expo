// Aba Conquistas: as 6 medalhas (ganhas com a data, ou bloqueadas com o que falta).
import { Text, View } from 'react-native';
import * as L from '../logica/jogo';
import type { Plantinha } from '../estado/usePlantinha';
import Tela from '../componentes/Tela';
import { cor } from '../tema';
import { st } from './estilos';

export default function Conquistas({ p }: { p: Plantinha }) {
  const nGanhas = L.MEDALHAS.filter((x) => p.ganhas[x.id]).length;
  return (
    <Tela titulo="🏅 Conquistas">
      <View style={st.painel} accessibilityLabel="Conquistas">
        <Text testID="mResumo" style={[st.resumo, st.b]}>{nGanhas + ' de ' + L.MEDALHAS.length + ' medalhas'}</Text>
        <View testID="medalhas" style={st.medalhas}>
          {L.MEDALHAS.map((x) => {
            const g = p.ganhas[x.id];
            return (
              <View key={x.id} style={[st.medalha, !g && st.medalhaBloq]}>
                <Text style={[st.medalhaEm, !g && { opacity: 0.35 }]}>{x.em}</Text>
                <Text style={[st.medalhaNome, !g && { color: cor.bloqueado }]}>{x.nome}</Text>
                <Text style={[st.medalhaInfo, !g && { color: cor.bloqueado }]}>{g ? '✅ ' + L.dataBR(g) : '🔒 ' + x.como}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Tela>
  );
}
