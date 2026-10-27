// Botão padrão do app: qualquer toque em botão para o som do alarme (como a captura de clique do PWA).
import type { ReactNode } from 'react';
import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { pararSom } from '../lembretes/som';

/** Botão: qualquer toque em botão para o som do alarme (como a captura de clique do PWA). */
export default function Botao({ onPress, children, style, textStyle, disabled, rotulo, pressed, testID }: {
  onPress: () => void; children: ReactNode; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>;
  disabled?: boolean; rotulo?: string; pressed?: boolean; testID?: string;
}) {
  return (
    <Pressable testID={testID} nativeID={testID} accessibilityRole="button" accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !!disabled, selected: pressed }} disabled={disabled}
      onPress={() => { pararSom(); onPress(); }}
      style={({ pressed: p }) => [style, disabled && { opacity: 0.4 }, p && { opacity: 0.75 }]}>
      <Text style={textStyle}>{children}</Text>
    </Pressable>
  );
}
