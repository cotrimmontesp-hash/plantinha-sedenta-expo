// Barra de abas própria e leve (sem biblioteca de navegação): 4 botões grandes, fixa embaixo,
// acima da barra de navegação do Android (safe area). Cores da proposta B.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ABAS, rotuloAba, type AbaId } from './abas';

export const corAbas = { fundo: '#fafcfb', linha: '#e2e8e4', texto: '#5d6e64', ativa: '#1f6b3a', ativaFundo: '#e2f4e8', ativaBorda: '#2f8f55' };

export default function BarraAbas({ aba, onTrocar }: { aba: AbaId; onTrocar: (a: AbaId) => void }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[st.barra, { paddingBottom: bottom }]} accessibilityRole="tablist">
      {ABAS.map((a) => {
        const on = a.id === aba;
        return (
          <Pressable key={a.id} testID={'aba-' + a.id} nativeID={'aba-' + a.id} accessibilityRole="tab" accessibilityLabel={rotuloAba(a.id)}
            accessibilityState={{ selected: on }} aria-selected={on} onPress={() => onTrocar(a.id)}
            style={({ pressed }) => [st.aba, on && st.abaOn, pressed && { opacity: 0.7 }]}>
            <Text style={st.em}>{a.em}</Text>
            <Text numberOfLines={1} style={[st.nome, on && st.nomeOn]}>{a.nome}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  barra: { flexDirection: 'row', backgroundColor: corAbas.fundo, borderTopWidth: 2, borderTopColor: corAbas.linha },
  aba: { flex: 1, minHeight: 66, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderTopWidth: 4, borderTopColor: 'transparent' },
  abaOn: { backgroundColor: corAbas.ativaFundo, borderTopColor: corAbas.ativaBorda },
  em: { fontSize: 24, lineHeight: 30 },
  nome: { fontSize: 15, color: corAbas.texto },
  nomeOn: { color: corAbas.ativa, fontWeight: '800' },
});
