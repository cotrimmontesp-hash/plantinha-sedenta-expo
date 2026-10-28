// Raiz das telas: 1 estado do jogo (usePlantinha) para as 4 abas + barra de abas embaixo.
// As janelas (meta, alarme, aviso de medalha) ficam aqui para aparecerem em qualquer aba.
import { useState } from 'react';
import { View } from 'react-native';
import { usePlantinha } from '../estado/usePlantinha';
import { ABA_INICIAL, type AbaId } from './abas';
import BarraAbas from './BarraAbas';
import Hoje from '../telas/Hoje';
import Historico from '../telas/Historico';
import Conquistas from '../telas/Conquistas';
import Ajustes from '../telas/Ajustes';
import { AvisoMedalha, DialogoMeta, TelaAlarme } from '../componentes/Dialogos';
import { st } from '../telas/estilos';

export default function Navegacao() {
  const p = usePlantinha();
  const [aba, setAba] = useState<AbaId>(ABA_INICIAL);
  if (!p.pronto) return <View style={st.fundo} />;
  return (
    <View style={st.fundo}>
      <View style={st.conteudo}>
        {aba === 'hoje' && <Hoje p={p} irPara={setAba} />}
        {aba === 'historico' && <Historico p={p} />}
        {aba === 'conquistas' && <Conquistas p={p} />}
        {aba === 'ajustes' && <Ajustes p={p} />}
        <AvisoMedalha p={p} />
      </View>
      <BarraAbas aba={aba} onTrocar={setAba} />
      <DialogoMeta p={p} />
      <TelaAlarme p={p} />
    </View>
  );
}
