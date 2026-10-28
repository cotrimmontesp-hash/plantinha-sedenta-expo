// Janelas por cima de qualquer aba: meta/tamanho do copo, tela do alarme e aviso de medalha (mesmas da v1.1.0).
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import * as L from '../logica/jogo';
import type { Plantinha } from '../estado/usePlantinha';
import Botao from './Botao';
import Encaixe from './Encaixe';
import { st } from '../telas/estilos';

export function DialogoMeta({ p }: { p: Plantinha }) {
  const { perm } = p;
  const txtNotif = perm === 'granted' ? '🔔 Lembretes ativados ✅' : perm === 'denied' ? '🔕 Lembretes bloqueados' + (Platform.OS === 'web' ? ' no navegador' : ' no celular') : perm === 'indisponivel' ? '🔔 Lembretes do celular indisponíveis aqui' : '🔔 Ativar lembretes do celular';
  return (
    <Modal visible={p.dlg} transparent animationType="fade" onRequestClose={p.fecharDlg}>
      <View style={st.veu}>
        <Encaixe style={st.veuCentro} testID="encaixe-meta">
        <View style={st.dialogo}>
          <Text style={st.b}>Tamanho do copo:</Text>
          <View testID="copos-ml" style={st.copos}>
            {L.COPOS_ML.map((ml) => (
              <Botao key={ml} testID={'ml' + ml} pressed={p.copoTemp === ml} onPress={() => p.setCopoTemp(L.limitarCopo(ml))} style={[st.copo, p.copoTemp === ml && st.opcaoOn]} textStyle={[st.copoTx, p.copoTemp === ml && { color: '#002' }]}>{ml + ' ml'}</Botao>
            ))}
          </View>
          <Text style={st.b}>Quantos copos de <Text testID="copoTxt">{p.copoTemp}</Text> ml por dia?</Text>
          <View style={st.contador}>
            <Botao testID="menos" rotulo="Diminuir" onPress={() => p.setMetaTemp((m) => L.limitarMeta(m - 1))} style={st.cont} textStyle={st.contTx}>−</Botao>
            <Text testID="metaVal" style={st.metaVal}>{p.metaTemp}</Text>
            <Botao testID="mais" rotulo="Aumentar" onPress={() => p.setMetaTemp((m) => L.limitarMeta(m + 1))} style={st.cont} textStyle={st.contTx}>+</Botao>
          </View>
          <Text testID="metaLitros" style={st.aviso}>{'= ' + p.metaTemp * p.copoTemp + ' ml (' + L.litros(p.metaTemp * p.copoTemp) + ')'}</Text>
          <Text style={st.aviso}>Referência ajustável, não é orientação médica.</Text>
          <Botao testID="notif" disabled={perm !== 'default'} onPress={p.permitirNotificacoes} style={[st.sec, st.cheio, { marginTop: 6 }]} textStyle={st.secTx}>{txtNotif}</Botao>
          <Botao testID="salvar" onPress={p.salvarMeta} style={st.ok} textStyle={st.okTx}>Salvar</Botao>
        </View>
        </Encaixe>
      </View>
    </Modal>
  );
}

export function TelaAlarme({ p }: { p: Plantinha }) {
  return (
    <Modal visible={p.alarme} transparent animationType="fade" onRequestClose={p.fecharAlarme}>
      <View style={[st.veu, { backgroundColor: 'rgba(0,0,0,.88)' }]} accessibilityRole="alert">
        <Encaixe style={st.veuCentro} testID="encaixe-alarme">
        <View style={[st.dialogo, { borderWidth: 3, gap: 14 }]}>
          <Text testID="alTit" style={st.alTit}>💧 Hora de beber água!</Text>
          <Botao testID="alBebi" onPress={p.bebiNoAlarme} style={st.alBebi} textStyle={st.alBebiTx}>Bebi um copo 💧</Botao>
          <Botao testID="alSoneca" onPress={p.soneca} style={[st.sec, st.cheio]} textStyle={st.secTx}>😴 Soneca 10 min</Botao>
        </View>
        </Encaixe>
      </View>
    </Modal>
  );
}

export function AvisoMedalha({ p }: { p: Plantinha }) {
  if (!p.toast) return null;
  return (
    <Pressable testID="toast" onPress={p.fecharToast} style={st.toast} accessibilityLiveRegion="assertive">
      <Text style={st.toastTx}>{p.toast}</Text>
    </Pressable>
  );
}
