// Encaixe: garante que o conteúdo caiba INTEIRO na área disponível, sem rolagem e sem cortar nada.
// O conteúdo ocupa pelo menos a altura da área (para os itens com flex crescerem, ex. a planta);
// se mesmo assim ficar mais alto (celular pequeno, fonte do sistema grande), ele é reduzido
// proporcionalmente (escala) até caber. Nunca esconde informação.
import { useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export default function Encaixe({ children, style, testID = 'encaixe' }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const [area, setArea] = useState(0);
  const [alto, setAlto] = useState(0);
  const escala = area > 0 && alto > area + 0.5 ? area / alto : 1;
  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={(ev) => setArea(ev.nativeEvent.layout.height)}>
      <View testID={testID} onLayout={(ev) => setAlto(ev.nativeEvent.layout.height)}
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, minHeight: area },
          escala < 1 && { transform: [{ translateY: -(alto - alto * escala) / 2 }, { scale: escala }] }, style]}>
        {children}
      </View>
    </View>
  );
}
