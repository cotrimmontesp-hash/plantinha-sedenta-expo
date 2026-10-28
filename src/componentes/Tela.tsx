// Moldura comum das abas: rolagem (para celulares pequenos), coluna de até 480 px e título da aba.
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { st } from '../telas/estilos';

export default function Tela({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={st.rolagem} keyboardShouldPersistTaps="handled">
      <View style={st.main}>
        <Text style={st.h1} accessibilityRole="header">{titulo}</Text>
        {children}
      </View>
    </ScrollView>
  );
}
