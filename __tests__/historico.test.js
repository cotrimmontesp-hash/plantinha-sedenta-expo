// Portado de /workspace/jogos/agua/testes/teste-historico-logica.js (PWA v5). Mesmas verificações, agora contra src/logica.ts.
const L=require('../src/logica');
const checks=[];
const t=s=>Date.parse(s);let n=0;const ok=(c,msg)=>{n++;checks.push([msg,!!c]);};
// estado antigo sem historico
const antigo={v:1,dia:'2026-10-26',copos:3,meta:8,copoMl:300,sequencia:2,ultimoDiaMeta:'2026-10-25',seqAntes:0,diaMetaAntes:null,ultimoGole:null};
let e=L.carregar(JSON.stringify(antigo),t('2026-10-26T15:00:00Z'));
ok(JSON.stringify(e.historico)==='{}'&&e.copos===3&&e.sequencia===2&&e.copoMl===300,'estado antigo sem historico carrega com {} sem perder campos');
ok(L.carregar(JSON.stringify(Object.assign({},antigo,{historico:[1]})),t('2026-10-26T15:00:00Z')).historico.constructor===Object,'historico inválido (array) vira {}');
let e2=L.carregar(JSON.stringify(Object.assign({},antigo,{dia:'2026-10-25'})),t('2026-10-26T15:00:00Z'));
ok(JSON.stringify(e2.historico)==='{}','dia antigo sem registro não é inventado na virada');
L.beber(e,t('2026-10-26T15:01:00Z'));
ok(JSON.stringify(e.historico['2026-10-26'])==='{"copos":4,"meta":8,"ml":1200}','beber atualiza hoje: 4 copos, meta 8, 1200 ml');
L.desfazer(e,t('2026-10-26T15:02:00Z'));ok(e.historico['2026-10-26'].copos===3&&e.historico['2026-10-26'].ml===900,'desfazer atualiza hoje');
L.mudarMeta(e,3,t('2026-10-26T15:03:00Z'));ok(e.historico['2026-10-26'].meta===3,'mudar meta atualiza hoje');
// virada: 23:59 SP -> 00:00 SP
L.beber(e,t('2026-10-27T02:59:00Z'));
L.virarDia(e,t('2026-10-27T03:00:10Z'));
ok(e.dia==='2026-10-27'&&e.copos===0&&JSON.stringify(e.historico['2026-10-26'])==='{"copos":4,"meta":3,"ml":1200}','virada preserva o dia anterior (4 copos, meta 3, 1200 ml) e zera hoje');
ok(!e.historico['2026-10-27'],'dia novo só aparece depois do 1º registro');
L.beber(e,t('2026-10-27T12:00:00Z'));ok(e.historico['2026-10-27'].copos===1&&e.historico['2026-10-26'].copos===4,'beber no dia novo não mexe no anterior');
// poda 30 dias
let p=L.novoEstado(t('2026-10-01T15:00:00Z'));
for(let d=0;d<40;d++){L.beber(p,t('2026-10-01T15:00:00Z')+d*864e5);}
const ks=Object.keys(p.historico).sort();
ok(ks.length===30&&ks[0]===L.diaDe(t('2026-10-01T15:00:00Z')+10*864e5)&&ks[29]===p.dia,'poda: só os últimos 30 dias');
// semana
let s=L.novoEstado(t('2026-10-26T15:00:00Z')); // segunda
s.historico={'2026-10-20':{copos:8,meta:8,ml:2000},'2026-10-22':{copos:4,meta:8,ml:1000},'2026-10-26':{copos:9,meta:8,ml:2250},'2026-10-10':{copos:8,meta:8,ml:2000}};
const w=L.semana(s);
ok(w.length===7&&w.map(o=>o.letra).join('')==='TQQSSDS','letras 20/10 (ter) a 26/10 (seg): T Q Q S S D S');
ok(w[6].hoje&&w[6].dia==='2026-10-26'&&!w[0].hoje,'hoje é a última barra');
ok(w[0].bateu&&!w[2].bateu&&w[6].bateu&&w[1].reg===null,'bateu/não bateu/sem registro');
ok(w.bateu===2&&w.com===3&&w.media===Math.round((2000+1000+2250)/3),'resumo: 2 de 7, média só dos dias com registro (1750)');
ok(L.semana(L.novoEstado(Date.now())).com===0,'sem registros => com 0');

describe('historico (teste-historico-logica.js)', () => {
  test.each(checks)('%s', (_msg, passou) => { expect(passou).toBe(true); });
});
