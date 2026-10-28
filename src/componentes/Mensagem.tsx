// A frase do momento (boas-vindas, copo registrado, meta salva, teste agendado...). Mesma da tela única.
import { Text } from 'react-native';
import type { Plantinha } from '../estado/usePlantinha';
import { st } from '../telas/estilos';

export default function Mensagem({ p }: { p: Plantinha }) {
  return <Text testID="msg" style={[st.msg, p.msg.alerta && st.msgAlerta]} accessibilityLiveRegion="polite">{p.msg.t}</Text>;
}
