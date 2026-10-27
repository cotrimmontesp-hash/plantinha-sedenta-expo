// Plantinha Sedenta — versão Expo (paridade com o PWA v5).
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as L from './src/logica';
import { carregarTudo, salvarDesp, salvarEstado, salvarMedalhas } from './src/armazenamento';
import { ALARME_NATIVO, AVISA_FECHADO, agendarLembretes, alarmeExato, alarmeTocando, apagarEventosAlarme, eventosAlarme, notificar, pedirAlarmeExato, pedirPermissao, pedirTelaCheia, permissao, responderAlarme, sincronizarAlarme, telaCheia, testarLembrete } from './src/notificacoes';
import { aplicarEventos, type Aplicado } from './src/eventos';
import { horariosLembretes } from './src/agenda';
import { pararSom, prepararSom, somTocando, tocarSom } from './src/som';
import { vibrar } from './src/vibrar';
import { cor } from './src/tema';
import Planta from './src/components/Planta';
import { Confete, Gota } from './src/components/Efeitos';

SplashScreen.preventAutoHideAsync().catch(() => {});

const FRASES = ['Boa! A plantinha agradece 🌿', 'Mais um! Ela está crescendo 💚', 'Isso aí, Paulo! 💧', 'Gole registrado ✅', 'Que beleza, continue assim 🌱'];
const ROTULO_INT: Record<number, string> = { 30: '30 min', 45: '45 min', 60: '1 hora', 90: '1h30', 120: '2 horas' };

/** Botão: qualquer toque em botão para o som do alarme (como a captura de clique do PWA). */
function Botao({ onPress, children, style, textStyle, disabled, rotulo, pressed, testID }: {
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

/** Placar numa linha só (como o white-space:nowrap do PWA): diminui a fonte em textos longos. */
const tam = (t: string) => ({ fontSize: t.length >= 8 ? 22 : t.length >= 7 ? 25 : 30 });

function hhmmMais(t: string, delta: number): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t) ?? ['', '8', '0'];
  let v = (+m[1] * 60 + +m[2]);
  v = (Math.round(v / 15) * 15 + delta + 1440) % 1440;
  return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
}

function Jogo() {
  const [, render] = useReducer((x: number) => x + 1, 0);
  const [pronto, setPronto] = useState(false);
  const est = useRef<L.Estado>(L.novoEstado(Date.now()));
  const desp = useRef<L.Despertador>(L.novoDesp());
  const ganhas = useRef<L.Medalhas>({});
  const abertura = useRef(Date.now());
  const avisouMurcha = useRef(false);
  const [msg, setMsgS] = useState<{ t: string; alerta: boolean }>({ t: '', alerta: false });
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [alarme, setAlarme] = useState(false);
  const alarmeRef = useRef(false);
  const [dlg, setDlg] = useState(false);
  const [metaTemp, setMetaTemp] = useState(8);
  const [copoTemp, setCopoTemp] = useState(250);
  const [perm, setPerm] = useState<string>('default');
  const [exato, setExato] = useState(true);
  const [telaOk, setTelaOk] = useState(true);
  const [reabriu, setReabriu] = useState(0);
  const [gotas, setGotas] = useState<number[]>([]);
  const [festa, setFesta] = useState(0);
  const { width, height } = useWindowDimensions();
  const larguraMain = Math.min(width, 480) - 32;
  const larguraPlanta = Math.min(larguraMain - 4, (height * 0.42 * 300) / 320);

  const msgF = useCallback((t: string, alerta = false) => setMsgS({ t, alerta }), []);
  const mostrarAlarme = (v: boolean) => { alarmeRef.current = v; setAlarme(v); };

  const conferirMedalhas = useCallback((semVibrar?: boolean) => {
    const e = est.current;
    const novas = L.avaliarMedalhas(e, desp.current, e.dia, ganhas.current);
    if (!novas.length) return novas;
    novas.forEach((id) => { ganhas.current[id] = e.dia; });
    salvarMedalhas(ganhas.current);
    const nomes = novas.map((id) => { const x = L.MEDALHAS.find((m) => m.id === id)!; return x.em + ' ' + x.nome; });
    setToast('🏅 ' + (novas.length > 1 ? 'Novas medalhas: ' : 'Nova medalha: ') + nomes.join(', ') + '!');
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 4500);
    if (!semVibrar) setTimeout(() => vibrar([60, 40, 60]), 450);
    render();
    return novas;
  }, []);

  const dispararAlarme = useCallback((teste: boolean) => {
    if (!teste) { L.marcarToque(desp.current, Date.now()); salvarDesp(desp.current); }
    setDlg(false);
    mostrarAlarme(true); tocarSom();
    if (!teste) { notificar('💧 Hora de beber água! A plantinha está esperando.', true); msgF('⏰ Hora de beber água!', true); }
    render();
  }, [msgF]);

  /** Mostra o que o alarme do Android fez com o app fechado (copos do "Já bebi", soneca). */
  const avisarAlarme = useCallback((r: Aplicado) => {
    if (r.copos > 0) {
      const e = est.current;
      setGotas((g) => [...g, Date.now()]);
      if (r.resultados.indexOf('bateu') >= 0 && L.bateuMeta(e)) { setFesta((f) => f + 1); msgF('🌸 Meta do dia batida pelo alarme! Sequência: ' + L.sequenciaVisivel(e) + ' dia(s).'); }
      else msgF('💧 ' + (r.copos > 1 ? r.copos + ' copos registrados' : 'Copo registrado') + ' pelo alarme. Agora são ' + e.copos + '/' + e.meta + '.');
    } else if (r.ultimo === 'soneca' && desp.current.soneca) msgF('😴 Soneca: toco de novo às ' + L.hhmm(desp.current.soneca) + '.');
  }, [msgF]);

  /** Android: aplica os eventos do alarme nativo (gravados enquanto o app estava fechado ou em segundo plano). */
  const puxarEventos = useCallback(() => {
    const ev = eventosAlarme();
    if (!ev.length) return;
    const r = aplicarEventos(est.current, desp.current, ev);
    L.virarDia(est.current, Date.now());
    salvarEstado(est.current); salvarDesp(desp.current);
    apagarEventosAlarme(ev[ev.length - 1].t);
    if (r.copos > 0 || r.ultimo === 'soneca') mostrarAlarme(false); // respondido na tela de alarme do Android
    avisarAlarme(r);
    render(); conferirMedalhas();
  }, [avisarAlarme, conferirMedalhas]);

  const conferirAlarme = useCallback(() => {
    if (ALARME_NATIVO) { // no Android quem toca é o alarme nativo (até com o app aberto)
      puxarEventos();
      if (alarmeTocando() && !alarmeRef.current) { setDlg(false); mostrarAlarme(true); } // botões também no app (ex.: notificações bloqueadas)
      render(); return;
    }
    if (!alarmeRef.current && L.deveTocar(desp.current, est.current.ultimoGole, Date.now())) dispararAlarme(false); // 1 vez só
    render();
  }, [dispararAlarme, puxarEventos]);

  const verificar = useCallback(() => {
    const e = est.current, antes = e.dia;
    L.virarDia(e, Date.now());
    if (e.dia !== antes) { salvarEstado(e); abertura.current = Date.now(); avisouMurcha.current = false; msgF('☀️ Novo dia! A plantinha recomeçou. Bom primeiro copo!'); }
    const murcha = L.estaMurcha(e, Date.now(), abertura.current);
    if (murcha && !avisouMurcha.current && !desp.current.ligado) { // com despertador ligado, quem avisa é ele
      avisouMurcha.current = true;
      const t = "Ei, Paulo, a plantinha está com sede 🥀 Que tal um copo d'água agora?";
      msgF(t, true); notificar(t); vibrar([200, 100, 200]);
    }
    render();
  }, [msgF]);

  // carregar
  useEffect(() => {
    let vivo = true;
    const ev = eventosAlarme(); // Android: o que o alarme gravou com o app fechado
    carregarTudo(Date.now(), ev).then((d) => {
      if (!vivo) return;
      est.current = d.est; desp.current = d.desp; ganhas.current = d.ganhas;
      abertura.current = Date.now();
      msgF(d.est.copos === 0 ? "Olá! Toque no botão amarelo a cada copo d'água 💧" : 'Bem-vindo de volta! ' + d.est.copos + ' copo(s) hoje.');
      if (ev.length) { salvarEstado(d.est); salvarDesp(d.desp); apagarEventosAlarme(ev[ev.length - 1].t); avisarAlarme(d.alarme); }
      setPronto(true);
      SplashScreen.hideAsync().catch(() => {});
      conferirMedalhas(true); // dados antigos: concede as que já valem (sem vibrar)
      permissao().then(setPerm); alarmeExato().then(setExato); telaCheia().then(setTelaOk);
    });
    return () => { vivo = false; };
  }, [conferirMedalhas, msgF, avisarAlarme]);

  // relógios: virada de dia/sede a cada 30 s, despertador a cada 15 s, e ao voltar para o app
  useEffect(() => {
    if (!pronto) return;
    const a = setInterval(verificar, 30000), b = setInterval(conferirAlarme, 15000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') { verificar(); conferirAlarme(); permissao().then(setPerm); alarmeExato().then(setExato); telaCheia().then(setTelaOk); setReabriu((n) => n + 1); } });
    conferirAlarme();
    return () => { clearInterval(a); clearInterval(b); sub.remove(); };
  }, [pronto, verificar, conferirAlarme]);

  const e = est.current, d = desp.current;
  const prox = L.proximoAlarme(d, e.ultimoGole, Date.now());
  // app fechado: agenda no celular TODOS os lembretes dos próximos dias; refaz ao abrir, beber, tocar e mudar a config
  const chaveAgenda = [d.ligado, d.intervalo, d.inicio, d.fim, d.soneca, d.ultimoToque, d.ligadoEm, e.ultimoGole, perm, exato, reabriu].join('|');
  useEffect(() => {
    if (!pronto) return;
    if (ALARME_NATIVO) sincronizarAlarme(desp.current, est.current.ultimoGole); // Android: alarme nativo em loop
    else agendarLembretes(horariosLembretes(desp.current, est.current.ultimoGole, Date.now()));
  }, [pronto, chaveAgenda]);

  // ganchos para os testes no navegador (só web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).__plantinha = {
      estado: () => est.current, desp: () => desp.current, medalhas: () => ganhas.current,
      verificar, conferirAlarme, setAbertura: (t: number) => { abertura.current = t; }, somTocando,
    };
  }, [verificar, conferirAlarme]);

  if (!pronto) return <View style={st.fundo} />;

  const s = L.estagio(e);
  const murcha = L.estaMurcha(e, Date.now(), abertura.current);
  const w = L.semana(e);
  const nGanhas = L.MEDALHAS.filter((x) => ganhas.current[x.id]).length;

  const beber = () => {
    const r = L.beber(e, Date.now());
    avisouMurcha.current = false; salvarEstado(e);
    setGotas((g) => [...g, Date.now()]);
    d.soneca = null; salvarDesp(d); mostrarAlarme(false);
    if (r === 'bateu') { setFesta((f) => f + 1); vibrar([80, 60, 80, 60, 160]); msgF('🌸 Meta do dia batida! A flor desabrochou! Sequência: ' + L.sequenciaVisivel(e) + ' dia(s).'); }
    else if (L.bateuMeta(e)) msgF('Já bateu a meta hoje — cada copo extra é bônus 💧');
    else msgF(FRASES[e.copos % FRASES.length] + ' Faltam ' + (e.meta - e.copos) + '.');
    vibrar(40);
    render(); conferirMedalhas();
  };
  const desfazer = () => { if (L.desfazer(e, Date.now())) { salvarEstado(e); msgF('Último copo desfeito ↩️ Agora são ' + e.copos + '.'); render(); } };
  const abrirMeta = () => { setMetaTemp(e.meta); setCopoTemp(e.copoMl); permissao().then(setPerm); setDlg(true); };
  const salvarMeta = () => {
    e.copoMl = copoTemp;
    const r = L.mudarMeta(e, metaTemp, Date.now()); salvarEstado(e); setDlg(false);
    if (r === 'bateu') { setFesta((f) => f + 1); vibrar([80, 60, 80, 60, 160]); msgF('🌸 Com a nova meta, você já bateu o dia!'); }
    else msgF('Meta salva: ' + e.meta + ' copos de ' + e.copoMl + ' ml (' + e.meta * e.copoMl + ' ml = ' + L.litros(e.meta * e.copoMl) + ').');
    render(); conferirMedalhas();
  };
  const ligarDesp = () => {
    d.ligado = !d.ligado; d.soneca = null;
    if (d.ligado) {
      d.ligadoEm = Date.now(); prepararSom();
      (perm === 'default' ? pedirPermissao() : Promise.resolve(perm)).then((p) => {
        setPerm(p);
        if (p === 'granted' && AVISA_FECHADO) pedirAlarmeExato().then(setExato).then(() => (ALARME_NATIVO ? pedirTelaCheia().then(setTelaOk) : undefined));
      });
    }
    salvarDesp(d); render();
  };
  const mudarDesp = (k: 'intervalo' | 'inicio' | 'fim', v: number | string) => { (d as unknown as Record<string, unknown>)[k] = v; salvarDesp(d); render(); };
  const soneca = () => {
    if (alarmeTocando()) { responderAlarme(false); mostrarAlarme(false); puxarEventos(); return; } // alarme nativo: ele grava a soneca
    const t = L.soneca(d, Date.now()); salvarDesp(d); mostrarAlarme(false);
    msgF('😴 Soneca: toco de novo às ' + L.hhmm(t) + '.'); render();
  };
  const testarFechado = () => {
    testarLembrete(60).then((t) => {
      permissao().then(setPerm);
      msgF(t === null ? '🔕 Não deu para agendar: permita as notificações do app nas configurações do celular.' : (ALARME_NATIVO ? '🧪 Teste às ' + L.hhmm(t) + '. Apague a tela agora: vai tocar até você tocar em Já bebi ou Daqui a pouco.' : '🧪 Teste agendado para ' + L.hhmm(t) + '. Feche o app e apague a tela agora.'), t === null);
    });
  };
  const txtNotif = perm === 'granted' ? '🔔 Lembretes ativados ✅' : perm === 'denied' ? '🔕 Lembretes bloqueados' + (Platform.OS === 'web' ? ' no navegador' : ' no celular') : perm === 'indisponivel' ? '🔔 Lembretes do celular indisponíveis aqui' : '🔔 Ativar lembretes do celular';
  const proxTxt = prox === null ? 'Despertador desligado.' : 'Próximo lembrete às ' + L.hhmm(prox) + (L.diaDe(prox) !== L.diaDe(Date.now()) ? ' (amanhã)' : '') + (d.soneca ? ' 😴' : '');

  return (
    <View style={st.fundo}>
      <ScrollView contentContainerStyle={st.rolagem}>
        <View style={st.main}>
          <Text style={st.h1} accessibilityRole="header">🌱 Plantinha Sedenta</Text>

          <View style={st.placar}>
            <View style={st.caixa}><Text testID="copos" numberOfLines={1} style={[st.caixaB, tam(e.copos + '/' + e.meta)]}>{e.copos + '/' + e.meta}</Text><Text style={st.caixaS}>copos hoje</Text></View>
            <View style={st.caixa}><Text testID="ml" numberOfLines={1} style={[st.caixaB, tam(e.copos * e.copoMl + ' ml')]}>{e.copos * e.copoMl + ' ml'}</Text><Text style={st.caixaS}>de <Text testID="metaMl">{e.meta * e.copoMl}</Text> ml</Text></View>
            <View style={st.caixa}><Text testID="seq" numberOfLines={1} style={st.caixaB}>{L.sequenciaVisivel(e)}</Text><Text style={st.caixaS}>dias seguidos 🔥</Text></View>
          </View>
          <View style={st.barra} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View testID="barra" style={[st.barraIn, { width: (Math.min(100, (e.copos / e.meta) * 100) + '%') as `${number}%` }]} />
          </View>

          <View style={[st.palco, murcha && s > 0 && st.palcoMurcho]}>
            <View style={{ width: larguraPlanta, alignSelf: 'center' }}>
              <Planta estagio={s} murcha={murcha} largura={larguraPlanta} />
              {gotas.map((g) => <Gota key={g} largura={larguraPlanta} onFim={() => setGotas((x) => x.filter((y) => y !== g))} />)}
            </View>
            {festa > 0 && <Confete key={festa} onFim={() => setFesta(0)} />}
          </View>

          <Text testID="msg" style={[st.msg, msg.alerta && st.msgAlerta]} accessibilityLiveRegion="polite">{msg.t}</Text>

          <Botao testID="beber" onPress={beber} style={st.beber} textStyle={st.beberTx}>Bebi um copo 💧</Botao>
          <View style={st.linha}>
            <Botao testID="desfazer" onPress={desfazer} disabled={e.copos === 0} style={st.sec} textStyle={st.secTx}>↩️ Desfazer último</Botao>
            <Botao testID="config" onPress={abrirMeta} style={st.sec} textStyle={st.secTx}>⚙️ Meta</Botao>
          </View>

          <View style={st.painel} accessibilityLabel="Últimos 7 dias">
            <Text style={st.h2}>📊 Últimos 7 dias <Text style={{ fontSize: 15, fontWeight: '400' }}>(ml)</Text></Text>
            <View testID="hist" style={st.hist}>
              {w.map((o) => {
                const x = o.reg, h = x ? Math.round(Math.min(1, x.copos / x.meta) * 100) : 0;
                return (
                  <View key={o.dia} style={st.histCol} accessibilityLabel={o.dia}>
                    <Text style={[st.histTx, o.hoje && st.histHoje]}>{x ? x.ml : '–'}</Text>
                    <View style={[st.histBarra, { height: Math.max(3, h) }, { backgroundColor: !x ? cor.borda : o.bateu ? cor.verde : cor.agua }]} />
                    <Text style={[st.histLetra, o.hoje && st.histHoje, o.hoje && st.histHojeB]}>{o.letra}</Text>
                  </View>
                );
              })}
            </View>
            <Text testID="hResumo" style={st.resumo}>{w.com ? 'Bateu a meta em ' + w.bateu + ' de 7 dias · média ' + w.media + ' ml/dia' : 'Ainda sem histórico'}</Text>
          </View>

          <View style={st.painel} accessibilityLabel="Conquistas">
            <Text style={st.h2}>🏅 Conquistas</Text>
            <View testID="medalhas" style={st.medalhas}>
              {L.MEDALHAS.map((x) => {
                const g = ganhas.current[x.id];
                return (
                  <View key={x.id} style={[st.medalha, !g && st.medalhaBloq]}>
                    <Text style={[st.medalhaEm, !g && { opacity: 0.35 }]}>{x.em}</Text>
                    <Text style={[st.medalhaNome, !g && { color: cor.bloqueado }]}>{x.nome}</Text>
                    <Text style={[st.medalhaInfo, !g && { color: cor.bloqueado }]}>{g ? '✅ ' + L.dataBR(g) : '🔒 ' + x.como}</Text>
                  </View>
                );
              })}
            </View>
            <Text testID="mResumo" style={st.resumo}>{nGanhas + ' de ' + L.MEDALHAS.length + ' medalhas'}</Text>
          </View>

          <View style={st.painel} accessibilityLabel="Despertador">
            <Text style={st.h2}>⏰ Despertador</Text>
            <Botao testID="dLiga" onPress={ligarDesp} pressed={d.ligado} style={[st.sec, st.cheio, d.ligado && { backgroundColor: cor.verde, borderColor: cor.verde }]} textStyle={[st.secTx, d.ligado && { color: '#111', fontWeight: '800' }]}>
              {d.ligado ? '🔔 Ligado (tocar para desligar)' : '🔕 Desligado (tocar para ligar)'}
            </Botao>
            <Text style={st.rotulo}>A cada:</Text>
            <View style={st.grade}>
              {L.INTERVALOS.map((i) => (
                <Botao key={i} testID={'dInt' + i} onPress={() => mudarDesp('intervalo', i)} pressed={d.intervalo === i} style={[st.opcao, d.intervalo === i && st.opcaoOn]} textStyle={[st.opcaoTx, d.intervalo === i && { color: '#002' }]}>{ROTULO_INT[i]}</Botao>
              ))}
            </View>
            {(['inicio', 'fim'] as const).map((k) => (
              <View key={k} style={st.hora}>
                <Text style={[st.rotulo, { width: 52 }]}>{k === 'inicio' ? 'Das' : 'Até'}</Text>
                <Botao testID={k + 'Menos'} rotulo={'Mais cedo'} onPress={() => mudarDesp(k, hhmmMais(d[k], -15))} style={st.passo} textStyle={st.passoTx}>−</Botao>
                <Text testID={k === 'inicio' ? 'dIni' : 'dFim'} style={st.horaTx}>{d[k]}</Text>
                <Botao testID={k + 'Mais'} rotulo={'Mais tarde'} onPress={() => mudarDesp(k, hhmmMais(d[k], 15))} style={st.passo} textStyle={st.passoTx}>+</Botao>
              </View>
            ))}
            <Text testID="dProx" style={st.prox} accessibilityLiveRegion="polite">{proxTxt}</Text>
            <Botao testID="dTeste" onPress={() => { prepararSom(); dispararAlarme(true); }} style={[st.sec, st.cheio]} textStyle={st.secTx}>🔊 Testar despertador</Botao>
            {AVISA_FECHADO && <Botao testID="dTesteFechado" onPress={testarFechado} style={[st.sec, st.cheio]} textStyle={st.secTx}>⏱️ Testar lembrete em 1 min</Botao>}
            {AVISA_FECHADO && d.ligado && !exato && <Botao testID="dExato" onPress={() => pedirAlarmeExato().then(setExato)} style={[st.sec, st.cheio]} textStyle={st.secTx}>⚠️ Permitir alarmes na hora certa</Botao>}
            {ALARME_NATIVO && d.ligado && !telaOk && <Botao testID="dTela" onPress={() => pedirTelaCheia().then(setTelaOk)} style={[st.sec, st.cheio]} textStyle={st.secTx}>⚠️ Permitir alarme em tela cheia</Botao>}
            <Text style={st.aviso}>{Platform.OS === 'web' ? 'Mantenha o app aberto; ele toca enquanto estiver aberto ou recém-fechado.' : ALARME_NATIVO ? 'Toca como despertador, até com o app fechado e a tela bloqueada, e só para quando você tocar em "Já bebi" ou "Daqui a pouco". Precisa das notificações ativadas. Celular desligado não toca.' : 'Com o app aberto, toca o alarme. Com o app fechado ou a tela apagada, o celular toca o lembrete (precisa das notificações ativadas). Celular desligado não toca.'}</Text>
          </View>
          <Text style={st.aviso}>A meta é só uma referência ajustável, não é orientação médica. Na dúvida, converse com seu médico.</Text>
        </View>
      </ScrollView>

      {/* Meta e tamanho do copo */}
      <Modal visible={dlg} transparent animationType="fade" onRequestClose={() => setDlg(false)}>
        <View style={st.veu}>
          <View style={st.dialogo}>
            <Text style={st.b}>Tamanho do copo:</Text>
            <View testID="copos-ml" style={st.copos}>
              {L.COPOS_ML.map((ml) => (
                <Botao key={ml} testID={'ml' + ml} pressed={copoTemp === ml} onPress={() => setCopoTemp(L.limitarCopo(ml))} style={[st.copo, copoTemp === ml && st.opcaoOn]} textStyle={[st.copoTx, copoTemp === ml && { color: '#002' }]}>{ml + ' ml'}</Botao>
              ))}
            </View>
            <Text style={st.b}>Quantos copos de <Text testID="copoTxt">{copoTemp}</Text> ml por dia?</Text>
            <View style={st.contador}>
              <Botao testID="menos" rotulo="Diminuir" onPress={() => setMetaTemp((m) => L.limitarMeta(m - 1))} style={st.cont} textStyle={st.contTx}>−</Botao>
              <Text testID="metaVal" style={st.metaVal}>{metaTemp}</Text>
              <Botao testID="mais" rotulo="Aumentar" onPress={() => setMetaTemp((m) => L.limitarMeta(m + 1))} style={st.cont} textStyle={st.contTx}>+</Botao>
            </View>
            <Text testID="metaLitros" style={st.aviso}>{'= ' + metaTemp * copoTemp + ' ml (' + L.litros(metaTemp * copoTemp) + ')'}</Text>
            <Text style={st.aviso}>Referência ajustável, não é orientação médica.</Text>
            <Botao testID="notif" disabled={perm !== 'default'} onPress={() => pedirPermissao().then(setPerm)} style={[st.sec, st.cheio, { marginTop: 10 }]} textStyle={st.secTx}>{txtNotif}</Botao>
            <Botao testID="salvar" onPress={salvarMeta} style={st.ok} textStyle={st.okTx}>Salvar</Botao>
          </View>
        </View>
      </Modal>

      {/* Tela do alarme */}
      <Modal visible={alarme} transparent animationType="fade" onRequestClose={() => mostrarAlarme(false)}>
        <View style={[st.veu, { backgroundColor: 'rgba(0,0,0,.88)' }]} accessibilityRole="alert">
          <View style={[st.dialogo, { borderWidth: 3, gap: 14 }]}>
            <Text testID="alTit" style={st.alTit}>💧 Hora de beber água!</Text>
            <Botao testID="alBebi" onPress={() => { mostrarAlarme(false); if (alarmeTocando()) { responderAlarme(true); puxarEventos(); } else beber(); }} style={st.alBebi} textStyle={st.alBebiTx}>Bebi um copo 💧</Botao>
            <Botao testID="alSoneca" onPress={soneca} style={[st.sec, st.cheio]} textStyle={st.secTx}>😴 Soneca 10 min</Botao>
          </View>
        </View>
      </Modal>

      {toast && (
        <Pressable testID="toast" onPress={() => setToast(null)} style={st.toast} accessibilityLiveRegion="assertive">
          <Text style={st.toastTx}>{toast}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: cor.fundo }}>
        <StatusBar style="light" />
        <Jogo />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cor.fundo },
  rolagem: { alignItems: 'center' },
  main: { width: '100%', maxWidth: 480, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  h1: { fontSize: 28, fontWeight: '700', color: cor.texto, textAlign: 'center', marginTop: 4 },
  h2: { fontSize: 22, fontWeight: '700', color: cor.texto },
  placar: { flexDirection: 'row', gap: 10 },
  caixa: { flex: 1, backgroundColor: cor.cartao, borderWidth: 2, borderColor: cor.borda, borderRadius: 16, padding: 10, alignItems: 'center' },
  caixaB: { fontSize: 30, fontWeight: '700', color: cor.agua, textAlign: 'center' },
  caixaS: { fontSize: 17, color: cor.suave, textAlign: 'center' },
  barra: { height: 22, backgroundColor: cor.escuro, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: cor.borda },
  barraIn: { height: '100%', backgroundColor: cor.agua },
  palco: { backgroundColor: '#14344b', borderRadius: 20, borderWidth: 2, borderColor: cor.borda, overflow: 'hidden', position: 'relative' },
  palcoMurcho: {},
  msg: { fontSize: 21, color: cor.texto, textAlign: 'center', minHeight: 56, fontWeight: '600' },
  msgAlerta: { backgroundColor: cor.alertaFundo, borderWidth: 2, borderColor: cor.botao, borderRadius: 14, padding: 10 },
  beber: { backgroundColor: cor.botao, borderRadius: 18, paddingVertical: 22, paddingHorizontal: 10, minHeight: 92, justifyContent: 'center', borderBottomWidth: 6, borderBottomColor: cor.botaoSombra },
  beberTx: { fontSize: 30, fontWeight: '800', color: cor.botaoTx, textAlign: 'center' },
  linha: { flexDirection: 'row', gap: 10 },
  sec: { flex: 1, borderWidth: 3, borderColor: cor.contorno, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, minHeight: 60, justifyContent: 'center' },
  cheio: { flex: 0, width: '100%' },
  secTx: { fontSize: 19, color: cor.texto, textAlign: 'center' },
  painel: { backgroundColor: cor.cartao, borderWidth: 2, borderColor: cor.borda, borderRadius: 16, padding: 12, gap: 10 },
  hist: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 150 },
  histCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', minWidth: 0 },
  histTx: { fontSize: 14, color: cor.suave },
  histBarra: { width: '70%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  histLetra: { fontSize: 15, fontWeight: '700', color: cor.suave, paddingHorizontal: 4 },
  histHoje: { color: '#fff', fontWeight: '800' },
  histHojeB: { borderWidth: 2, borderColor: cor.botao, borderRadius: 6 },
  resumo: { fontSize: 17, color: cor.texto, textAlign: 'center' },
  medalhas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medalha: { width: '48.5%', flexGrow: 1, flexBasis: '45%', backgroundColor: cor.escuro, borderWidth: 2, borderColor: cor.botao, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center' },
  medalhaBloq: { borderColor: cor.borda },
  medalhaEm: { fontSize: 34, lineHeight: 42 },
  medalhaNome: { fontSize: 17, fontWeight: '700', color: cor.texto, textAlign: 'center' },
  medalhaInfo: { fontSize: 14, color: cor.suave, textAlign: 'center' },
  rotulo: { fontSize: 20, color: cor.texto },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: { flexGrow: 1, flexBasis: '30%', minHeight: 56, borderWidth: 3, borderColor: cor.contorno, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 4 },
  opcaoOn: { backgroundColor: cor.agua, borderColor: cor.agua },
  opcaoTx: { fontSize: 19, fontWeight: '800', color: cor.texto, textAlign: 'center' },
  hora: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passo: { width: 60, height: 56, borderRadius: 14, backgroundColor: cor.agua, justifyContent: 'center' },
  passoTx: { fontSize: 30, fontWeight: '800', color: '#002', textAlign: 'center' },
  horaTx: { flex: 1, fontSize: 26, fontWeight: '800', color: cor.texto, textAlign: 'center', backgroundColor: cor.escuro, borderWidth: 2, borderColor: cor.contorno, borderRadius: 12, paddingVertical: 8 },
  prox: { fontSize: 20, fontWeight: '700', color: cor.agua },
  aviso: { fontSize: 16, color: cor.suave, textAlign: 'center' },
  veu: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialogo: { backgroundColor: cor.cartao, borderWidth: 2, borderColor: cor.agua, borderRadius: 18, padding: 18, width: '100%', maxWidth: 420, gap: 8 },
  b: { fontSize: 20, fontWeight: '700', color: cor.texto },
  copos: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  copo: { flex: 1, minHeight: 60, borderWidth: 3, borderColor: cor.contorno, borderRadius: 18, justifyContent: 'center', padding: 4 },
  copoTx: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  contador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginVertical: 10 },
  cont: { width: 70, height: 70, borderRadius: 18, backgroundColor: cor.agua, justifyContent: 'center' },
  contTx: { fontSize: 36, fontWeight: '800', color: '#002', textAlign: 'center' },
  metaVal: { fontSize: 44, fontWeight: '800', color: cor.texto, minWidth: 56, textAlign: 'center' },
  ok: { backgroundColor: cor.botao, borderRadius: 18, padding: 14, marginTop: 8 },
  okTx: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center' },
  alTit: { fontSize: 30, fontWeight: '800', color: cor.texto, textAlign: 'center' },
  alBebi: { backgroundColor: cor.botao, borderRadius: 18, minHeight: 88, justifyContent: 'center' },
  alBebiTx: { fontSize: 28, fontWeight: '800', color: '#111', textAlign: 'center' },
  toast: { position: 'absolute', left: 12, right: 12, bottom: 18, backgroundColor: cor.botao, borderRadius: 16, padding: 14, elevation: 8, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  toastTx: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center' },
});
