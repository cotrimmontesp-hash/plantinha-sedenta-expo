// Moldura comum das abas: SEM rolagem. Coluna de até 480 px com o título da aba, que ocupa a altura
// disponível (acima da barra de abas); o Encaixe reduz tudo proporcionalmente se não couber.
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Encaixe from './Encaixe';
import { st } from '../telas/estilos';

export default function Tela({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Encaixe style={st.centro}>
      <View style={st.main}>
        <Text style={st.h1} accessibilityRole="header">{titulo}</Text>
        {children}
      </View>
    </Encaixe>
  );
}
