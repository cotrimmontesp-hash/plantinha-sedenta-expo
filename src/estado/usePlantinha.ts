// Estado ÚNICO do jogo, compartilhado pelas 4 abas: copos, histórico, medalhas, despertador, avisos e tela do alarme.
// Veio de src/telas/Jogo.tsx (v1.1.0) sem mudar a lógica: mesmos efeitos (carregar, relógios de 30 s / 15 s,
// reagendar ao abrir/voltar, permissões) e mesmas ações (beber, desfazer, meta, despertador, soneca, testes).
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as L from '../logica/jogo';
import { carregarTudo, salvarDesp, salvarEstado, salvarMedalhas } from '../dados/armazenamento';
import { permissoesFaltando, pedirEmSequencia } from '../logica/permissoes';
import { ALARME_NATIVO, AVISA_FECHADO, agendarLembretes, alarmeExato, alarmeTocando, apagarEventosAlarme, eventosAlarme, notificar, pedirAlarmeExato, pedirPermissao, pedirTelaCheia, permissao, responderAlarme, sincronizarAlarme, telaCheia, testarLembrete } from '../lembretes/notificacoes';
import { aplicarEventos, type Aplicado } from '../logica/eventos';
import { horariosLembretes } from '../logica/agenda';
import { prepararSom, somTocando, tocarSom } from '../lembretes/som';
import { vibrar } from '../lembretes/vibrar';

const FRASES = ['Boa! A plantinha agradece 🌿', 'Mais um! Ela está crescendo 💚', 'Isso aí, Paulo! 💧', 'Gole registrado ✅', 'Que beleza, continue assim 🌱'];

export function usePlantinha() {
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

  /* ===== ações (as mesmas da tela única da v1.1.0) ===== */
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
  /** "Bebi um copo" na tela de alarme do app. */
  const bebiNoAlarme = () => { mostrarAlarme(false); if (alarmeTocando()) { responderAlarme(true); puxarEventos(); } else beber(); };
  const testarDespertador = () => { prepararSom(); dispararAlarme(true); };
  const testarFechado = () => {
    testarLembrete(60).then((t) => {
      permissao().then(setPerm);
      msgF(t === null ? '🔕 Não deu para agendar: permita as notificações do app nas configurações do celular.' : (ALARME_NATIVO ? '🧪 Teste às ' + L.hhmm(t) + '. Apague a tela agora: vai tocar até você tocar em Já bebi ou Daqui a pouco.' : '🧪 Teste agendado para ' + L.hhmm(t) + '. Feche o app e apague a tela agora.'), t === null);
    });
  };
  /** Botão único ⚠️ de Ajustes: pede as permissões do alarme que faltam, uma depois da outra. */
  const faltamPerm = permissoesFaltando({ avisaFechado: AVISA_FECHADO, alarmeNativo: ALARME_NATIVO, ligado: d.ligado, exato, telaOk });
  const permitirAlarmes = () => {
    pedirEmSequencia(faltamPerm, { exato: pedirAlarmeExato, telaCheia: pedirTelaCheia }, (q, ok) => (q === 'exato' ? setExato(ok) : setTelaOk(ok)));
  };
  const permitirNotificacoes = () => { pedirPermissao().then(setPerm); };

  return {
    pronto, est: e, desp: d, ganhas: ganhas.current, murcha: L.estaMurcha(e, Date.now(), abertura.current), prox,
    msg, toast, fecharToast: () => setToast(null), alarme, fecharAlarme: () => mostrarAlarme(false),
    dlg, fecharDlg: () => setDlg(false), metaTemp, setMetaTemp, copoTemp, setCopoTemp,
    perm, exato, telaOk, gotas, tirarGota: (g: number) => setGotas((x) => x.filter((y) => y !== g)), festa, fimFesta: () => setFesta(0),
    beber, desfazer, abrirMeta, salvarMeta, ligarDesp, mudarDesp, soneca, bebiNoAlarme, testarDespertador, testarFechado,
    faltamPerm, permitirAlarmes, permitirNotificacoes,
  };
}

/** Tudo que as telas recebem (estado + ações). */
export type Plantinha = ReturnType<typeof usePlantinha>;
