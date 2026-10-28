// Aba Ajustes: meta (tamanho do copo e quantidade) e despertador (intervalo, início/fim, soneca 10 min, testes e permissões).
import { Platform, Text, View } from 'react-native';
import * as L from '../logica/jogo';
import { ALARME_NATIVO, AVISA_FECHADO } from '../lembretes/notificacoes';
import type { Plantinha } from '../estado/usePlantinha';
import Botao from '../componentes/Botao';
import Mensagem from '../componentes/Mensagem';
import Tela from '../componentes/Tela';
import { cor } from '../tema';
import { st } from './estilos';

const ROTULO_INT: Record<number, string> = { 30: '30 min', 45: '45 min', 60: '1 hora', 90: '1h30', 120: '2 horas' };

function hhmmMais(t: string, delta: number): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t) ?? ['', '8', '0'];
  let v = (+m[1] * 60 + +m[2]);
  v = (Math.round(v / 15) * 15 + delta + 1440) % 1440;
  return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
}

export default function Ajustes({ p }: { p: Plantinha }) {
  const e = p.est, d = p.desp, prox = p.prox;
  const proxTxt = prox === null ? 'Despertador desligado.' : 'Próximo lembrete às ' + L.hhmm(prox) + (L.diaDe(prox) !== L.diaDe(Date.now()) ? ' (amanhã)' : '') + (d.soneca ? ' 😴' : '');
  return (
    <Tela titulo="⚙️ Ajustes">
      <Mensagem p={p} />

      <View style={st.painel} accessibilityLabel="Meta">
        <Text style={st.rotulo}><Text style={st.h2}>🎯 Meta do dia: </Text><Text testID="aMeta">{e.meta + ' copos de ' + e.copoMl + ' ml = ' + e.meta * e.copoMl + ' ml (' + L.litros(e.meta * e.copoMl) + ')'}</Text></Text>
        <Botao testID="config" onPress={p.abrirMeta} style={[st.sec, st.cheio]} textStyle={st.secTx}>✏️ Mudar copo e meta</Botao>
        <Text style={st.aviso}>A meta é só uma referência ajustável, não é orientação médica. Na dúvida, converse com seu médico.</Text>
      </View>

      <View style={st.painel} accessibilityLabel="Despertador">
        <Text style={st.h2}>⏰ Despertador</Text>
        <Botao testID="dLiga" onPress={p.ligarDesp} pressed={d.ligado} style={[st.sec, st.cheio, d.ligado && { backgroundColor: cor.verde, borderColor: cor.verde }]} textStyle={[st.secTx, d.ligado && { color: '#111', fontWeight: '800' }]}>
          {d.ligado ? '🔔 Ligado (tocar para desligar)' : '🔕 Desligado (tocar para ligar)'}
        </Botao>
        {AVISA_FECHADO && d.ligado && !p.exato && <Botao testID="dExato" onPress={p.permitirExato} style={[st.sec, st.cheio, st.alertaBotao]} textStyle={st.secTx}>⚠️ Permitir alarmes na hora certa</Botao>}
        {ALARME_NATIVO && d.ligado && !p.telaOk && <Botao testID="dTela" onPress={p.permitirTelaCheia} style={[st.sec, st.cheio, st.alertaBotao]} textStyle={st.secTx}>⚠️ Permitir alarme em tela cheia</Botao>}
        <Text style={st.rotulo}>A cada:</Text>
        <View style={st.grade}>
          {L.INTERVALOS.map((i) => (
            <Botao key={i} testID={'dInt' + i} onPress={() => p.mudarDesp('intervalo', i)} pressed={d.intervalo === i} style={[st.opcao, d.intervalo === i && st.opcaoOn]} textStyle={[st.opcaoTx, d.intervalo === i && { color: '#002' }]}>{ROTULO_INT[i]}</Botao>
          ))}
        </View>
        <View style={st.horas}>
          {(['inicio', 'fim'] as const).map((k) => (
            <View key={k} style={st.horaCol}>
              <Text style={st.rotulo}>{k === 'inicio' ? 'Das' : 'Até'}</Text>
              <View style={st.hora}>
                <Botao testID={k + 'Menos'} rotulo={'Mais cedo'} onPress={() => p.mudarDesp(k, hhmmMais(d[k], -15))} style={st.passo} textStyle={st.passoTx}>−</Botao>
                <Text testID={k === 'inicio' ? 'dIni' : 'dFim'} style={st.horaTx}>{d[k]}</Text>
                <Botao testID={k + 'Mais'} rotulo={'Mais tarde'} onPress={() => p.mudarDesp(k, hhmmMais(d[k], 15))} style={st.passo} textStyle={st.passoTx}>+</Botao>
              </View>
            </View>
          ))}
        </View>
        <Text style={st.rotulo}>😴 Soneca: 10 min (botão "Daqui a pouco" no alarme)</Text>
        <Text testID="dProx" style={st.prox} accessibilityLiveRegion="polite">{proxTxt}</Text>
        <View style={st.linha}>
          <Botao testID="dTeste" onPress={p.testarDespertador} style={st.sec} textStyle={st.secTx}>🔊 Testar despertador</Botao>
          {AVISA_FECHADO && <Botao testID="dTesteFechado" onPress={p.testarFechado} style={st.sec} textStyle={st.secTx}>⏱️ Testar lembrete em 1 min</Botao>}
        </View>
        <Text style={st.aviso}>{Platform.OS === 'web' ? 'Mantenha o app aberto; ele toca enquanto estiver aberto ou recém-fechado.' : ALARME_NATIVO ? 'Toca como despertador, até com o app fechado e a tela bloqueada, e só para quando você tocar em "Já bebi" ou "Daqui a pouco". Precisa das notificações ativadas. Celular desligado não toca.' : 'Com o app aberto, toca o alarme. Com o app fechado ou a tela apagada, o celular toca o lembrete (precisa das notificações ativadas). Celular desligado não toca.'}</Text>
      </View>
    </Tela>
  );
}
