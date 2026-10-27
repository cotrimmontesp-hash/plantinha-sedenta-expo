// Portado de /workspace/jogos/agua/testes/teste-logica.js (PWA v5). Mesmas verificações, agora contra src/logica.ts.
const L=require('../src/logica');
const checks=[];
const t=s=>Date.parse(s); let n=0; const ok=(c,msg)=>{n++;checks.push([msg,!!c]);};
// fuso: 23:59 de SP = 02:59Z do dia seguinte
ok(L.diaDe(t('2026-10-27T02:59:00Z'))==='2026-10-26','23:59 em SP ainda é dia 26');
ok(L.diaDe(t('2026-10-27T03:00:00Z'))==='2026-10-27','00:00 em SP já é dia 27');
ok(L.diaAnterior('2026-03-01')==='2026-02-28','dia anterior atravessa mês');
// estágios
let e=L.novoEstado(t('2026-10-26T12:00:00Z'));
const est=[];for(let i=0;i<=8;i++){ if(i) L.beber(e,t('2026-10-26T12:00:00Z')+i*1000); est.push(L.estagio(e)); }

ok(est[0]===0&&est[1]===1&&est[7]===4&&est[8]===5,'estágios: 0 semente, 1 broto, 7=botão, 8=flor');
ok(est.every((v,i)=>i===0||v>=est[i-1]),'estágios nunca regridem ao beber');
ok(e.sequencia===1&&L.sequenciaVisivel(e)===1,'bater meta no 1º dia => sequência 1');
// desfazer
L.desfazer(e,t('2026-10-26T13:00:00Z'));
ok(e.copos===7&&L.sequenciaVisivel(e)===0&&L.estagio(e)===4,'desfazer abaixo da meta devolve sequência e estágio');
L.beber(e,t('2026-10-26T13:01:00Z'));
ok(e.sequencia===1,'rebater meta não conta em dobro');
L.beber(e,t('2026-10-26T13:02:00Z')); L.desfazer(e,t('2026-10-26T13:03:00Z'));
ok(e.copos===8&&e.sequencia===1,'desfazer copo extra mantém meta');
let z=L.novoEstado(Date.now()); ok(L.desfazer(z,Date.now())===false&&z.copos===0,'desfazer com 0 copos não fica negativo');
// virada de dia
L.virarDia(e,t('2026-10-27T03:00:30Z'));
ok(e.dia==='2026-10-27'&&e.copos===0&&L.sequenciaVisivel(e)===1,'meia-noite zera copos, mantém sequência');
for(let i=0;i<8;i++) L.beber(e,t('2026-10-27T15:00:00Z'));
ok(e.sequencia===2,'dia seguinte batido => sequência 2');
L.desfazer(e,t('2026-10-27T15:10:00Z'));
ok(L.sequenciaVisivel(e)===1,'desfazer no dia 2 volta sequência a 1');
L.beber(e,t('2026-10-27T15:11:00Z'));
// pula dia 28
L.virarDia(e,t('2026-10-29T12:00:00Z'));
ok(e.sequencia===0&&L.sequenciaVisivel(e)===0,'pular um dia quebra sequência');
for(let i=0;i<8;i++) L.beber(e,t('2026-10-29T13:00:00Z'));
ok(e.sequencia===1,'recomeça sequência em 1');
// sequência visível quebrada sem virarDia
let v=JSON.parse(JSON.stringify(e)); v.dia='2026-10-31'; ok(L.sequenciaVisivel(v)===0,'sequência exibida zera se último dia com meta foi antes de ontem');
// meta editável
let g=L.novoEstado(t('2026-10-26T12:00:00Z'));
for(let i=0;i<5;i++) L.beber(g,t('2026-10-26T12:00:00Z'));
ok(L.mudarMeta(g,5,t('2026-10-26T12:00:00Z'))==='bateu'&&g.sequencia===1,'baixar meta para 5 com 5 copos => bate');
L.mudarMeta(g,10,t('2026-10-26T12:00:00Z')); ok(g.sequencia===0,'subir meta de novo desfaz a batida');
ok(L.limitarMeta(0)===8&&L.limitarMeta(99)===20&&L.limitarMeta(-3)===8&&L.limitarMeta('abc')===8,'meta limitada 1..20 (inválido => 8)');
// murcha
let h=L.novoEstado(t('2026-10-26T12:00:00Z')); L.beber(h,t('2026-10-26T12:00:00Z'));
ok(!L.estaMurcha(h,t('2026-10-26T13:29:00Z'),0),'89 min: não murcha');
ok(L.estaMurcha(h,t('2026-10-26T13:30:00Z'),0),'90 min: murcha');
ok(!L.estaMurcha(h,t('2026-10-26T13:30:00Z'),t('2026-10-26T13:00:00Z')),'conta a partir da abertura da página se mais recente');
for(let i=0;i<7;i++) L.beber(h,t('2026-10-26T12:00:00Z')); ok(!L.estaMurcha(h,t('2026-10-26T20:00:00Z'),0),'meta batida: não murcha');
// persistência
let p=L.carregar(JSON.stringify(e),t('2026-10-29T20:00:00Z')); ok(p.copos===8&&p.sequencia===1,'carregar do localStorage mantém dados do mesmo dia');
ok(L.carregar('lixo{',Date.now()).copos===0,'JSON corrompido => estado novo');
ok(L.carregar(JSON.stringify(e),t('2026-10-30T12:00:00Z')).copos===0,'abrir no dia seguinte zera copos');
// tamanho do copo (v3)
if(L.limitarCopo){
  let a=L.carregar(JSON.stringify({v:1,dia:'2026-10-26',copos:3,meta:8,sequencia:2,ultimoDiaMeta:'2026-10-25'}),t('2026-10-26T15:00:00Z'));
  ok(a.copoMl===250&&a.copos===3&&a.sequencia===2,'estado antigo sem copoMl => 250, sem perder copos/sequência');
  ok(L.limitarCopo(500)===500&&L.limitarCopo('300')===300&&L.limitarCopo(123)===250&&L.limitarCopo(undefined)===250,'copoMl só 200/250/300/500 (inválido => 250)');
  ok(4*500===2000&&L.litros(4*500)==='2 litros','500 ml x 4 = 2000 ml / 2 litros');
  ok(L.litros(8*300)==='2,4 litros'&&L.litros(8*200)==='1,6 litros'&&L.litros(4*250)==='1 litro','300x8 = 2,4 litros; 200x8 = 1,6; 250x4 = 1 litro');
  let b=L.carregar(JSON.stringify(Object.assign(a,{copoMl:500})),t('2026-10-26T16:00:00Z')); ok(b.copoMl===500&&b.copos===3,'copoMl persiste ao recarregar e copos não são convertidos');
}

describe('logica (teste-logica.js)', () => {
  test.each(checks)('%s', (_msg, passou) => { expect(passou).toBe(true); });
});
