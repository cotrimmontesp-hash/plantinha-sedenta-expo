// Aba Hoje: planta, progresso (ml de hoje / meta), "Bebi um copo", "Desfazer", próximo lembrete e sequência.
import { Text, View, useWindowDimensions } from 'react-native';
import * as L from '../logica/jogo';
import { ALARME_NATIVO, AVISA_FECHADO } from '../lembretes/notificacoes';
import type { Plantinha } from '../estado/usePlantinha';
import type { AbaId } from '../navegacao/abas';
import Botao from '../componentes/Botao';
import Mensagem from '../componentes/Mensagem';
import Planta from '../componentes/Planta';
import Tela from '../componentes/Tela';
import { Confete, Gota } from '../componentes/Efeitos';
import { st } from './estilos';

/** Placar numa linha só: diminui a fonte em textos longos. */
const tam = (t: string) => ({ fontSize: t.length >= 9 ? 30 : 36 });

export default function Hoje({ p, irPara }: { p: Plantinha; irPara: (a: AbaId) => void }) {
  const { width, height } = useWindowDimensions();
  const e = p.est, d = p.desp;
  const larguraMain = Math.min(width, 480) - 32;
  const larguraPlanta = Math.min(larguraMain - 4, (height * 0.3 * 300) / 320); // menor que na tela única: a aba cabe sem rolar
  const s = L.estagio(e);
  const prox = p.prox;
  const proxTxt = prox === null ? 'Despertador desligado.' : 'Próximo lembrete às ' + L.hhmm(prox) + (L.diaDe(prox) !== L.diaDe(Date.now()) ? ' (amanhã)' : '') + (d.soneca ? ' 😴' : '');
  const faltaPermissao = d.ligado && ((AVISA_FECHADO && !p.exato) || (ALARME_NATIVO && !p.telaOk));
  const ml = e.copos * e.copoMl + ' ml';

  return (
    <Tela titulo="🌱 Hoje">
      <View style={st.palco}>
        <View style={{ width: larguraPlanta, alignSelf: 'center' }}>
          <Planta estagio={s} murcha={p.murcha} largura={larguraPlanta} />
          {p.gotas.map((g) => <Gota key={g} largura={larguraPlanta} onFim={() => p.tirarGota(g)} />)}
        </View>
        {p.festa > 0 && <Confete key={p.festa} onFim={p.fimFesta} />}
      </View>

      <View style={st.progresso} accessible accessibilityLabel={ml + ' de ' + e.meta * e.copoMl + ' ml hoje, ' + e.copos + ' de ' + e.meta + ' copos'}>
        <Text style={st.progressoTx} numberOfLines={1}>
          <Text testID="ml" style={[st.progressoMl, tam(ml)]}>{ml}</Text>
          <Text style={st.progressoMeta}>{' / '}<Text testID="metaMl">{e.meta * e.copoMl}</Text>{' ml'}</Text>
        </Text>
        <Text style={st.progressoCopos}><Text testID="copos">{e.copos + '/' + e.meta}</Text>{' copos hoje'}</Text>
      </View>
      <View style={st.barra} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View testID="barra" style={[st.barraIn, { width: (Math.min(100, (e.copos / e.meta) * 100) + '%') as `${number}%` }]} />
      </View>

      <Mensagem p={p} />

      <Botao testID="beber" onPress={p.beber} style={st.beber} textStyle={st.beberTx}>Bebi um copo 💧</Botao>
      <Botao testID="desfazer" onPress={p.desfazer} disabled={e.copos === 0} style={[st.sec, st.desfazer]} textStyle={st.secTx}>↩️ Desfazer último</Botao>

      <Text testID="hProx" style={st.infoHoje}>{'⏰ ' + proxTxt}</Text>
      <Text style={st.infoHoje}>{'🔥 '}<Text testID="seq">{L.sequenciaVisivel(e)}</Text>{L.sequenciaVisivel(e) === 1 ? ' dia seguido' : ' dias seguidos'}</Text>
      {faltaPermissao && <Botao testID="hPermissao" onPress={() => irPara('ajustes')} style={[st.sec, st.cheio, st.alertaBotao]} textStyle={st.secTx}>⚠️ O despertador precisa de permissão: toque para ver em Ajustes</Botao>}
    </Tela>
  );
}
