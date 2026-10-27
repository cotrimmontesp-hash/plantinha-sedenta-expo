// Portado de /workspace/jogos/agua/testes/teste-despertador-logica.js (PWA v5). Mesmas verificações, agora contra src/logica/jogo.ts.
const L=require('../src/logica/jogo');
const checks=[];
const sp=h=>Date.parse('2026-10-26T'+h+':00-03:00'); let n=0; const ok=(c,msg)=>{n++;checks.push([msg,!!c]);};
let d=L.novoDesp();
ok(d.intervalo===90&&d.inicio==='08:00'&&d.fim==='20:00'&&!d.ligado,'padrão: desligado, 90 min, 08:00–20:00');
ok(L.proximoAlarme(d,null,sp('10:00'))===null&&!L.deveTocar(d,sp('07:00'),sp('12:00')),'desligado nunca toca');
d.ligado=true; d.ligadoEm=sp('09:00');
ok(L.hhmm(L.proximoAlarme(d,null,sp('09:00')))==='10:30','ligou 09:00 => próximo 10:30');
ok(!L.deveTocar(d,null,sp('10:29'))&&L.deveTocar(d,null,sp('10:30')),'não toca 10:29, toca 10:30');
ok(L.hhmm(L.proximoAlarme(d,sp('10:00'),sp('10:05')))==='11:30','copo às 10:00 empurra para 11:30');
L.marcarToque(d,sp('10:30'));
ok(!L.deveTocar(d,null,sp('10:31'))&&L.hhmm(L.proximoAlarme(d,null,sp('10:31')))==='12:00','depois de tocar: não repete, próximo 12:00');
ok(!L.deveTocar(d,null,sp('11:59'))&&L.deveTocar(d,null,sp('15:00')),'voltar ao app bem atrasado: toca (uma vez)');
L.marcarToque(d,sp('15:00')); ok(!L.deveTocar(d,null,sp('15:00')+15000),'após disparo atrasado não acumula');
const t=L.soneca(d,sp('15:00'));
ok(L.hhmm(t)==='15:10'&&!L.deveTocar(d,null,sp('15:09'))&&L.deveTocar(d,null,sp('15:10')),'soneca 10 min: toca às 15:10');
L.marcarToque(d,sp('15:10')); ok(d.soneca===null&&L.hhmm(L.proximoAlarme(d,null,sp('15:11')))==='16:40','tocou na soneca => volta ao intervalo');
// janela
d=Object.assign(L.novoDesp(),{ligado:true,ligadoEm:sp('19:00')});
ok(L.naJanela(d,sp('08:00'))&&L.naJanela(d,sp('20:00'))&&!L.naJanela(d,sp('07:59'))&&!L.naJanela(d,sp('20:01')),'janela 08:00–20:00 (inclusive)');
const p=L.proximoAlarme(d,null,sp('19:10'));
ok(L.hhmm(p)==='08:00'&&L.diaDe(p)==='2026-10-27','alvo 20:30 cai fora => amanhã 08:00');
ok(!L.deveTocar(d,null,sp('20:30'))&&!L.deveTocar(d,null,sp('23:59')),'fora da janela não toca (20:30, 23:59)');
ok(L.deveTocar(d,null,p)&&!L.deveTocar(d,null,p-60000),'toca às 08:00 do dia seguinte, não às 07:59');
d=Object.assign(L.novoDesp(),{ligado:true,ligadoEm:sp('17:00')}); // alvo 18:30 dentro, app reaberto 22:00
const q=L.proximoAlarme(d,null,sp('22:00'));
ok(!L.deveTocar(d,null,sp('22:00'))&&L.hhmm(q)==='08:00'&&L.diaDe(q)==='2026-10-27','reaberto às 22:00 com alarme vencido: não toca, próximo amanhã 08:00');
d=Object.assign(L.novoDesp(),{ligado:true,ligadoEm:sp('05:00'),intervalo:30});
ok(L.hhmm(L.proximoAlarme(d,null,sp('05:10')))==='08:00','ligado de madrugada => 08:00');
d=Object.assign(L.novoDesp(),{ligado:true,inicio:'22:00',fim:'02:00'});
ok(L.naJanela(d,sp('23:00'))&&L.naJanela(d,sp('01:00'))&&!L.naJanela(d,sp('12:00')),'janela que passa da meia-noite');
// carregar
ok(L.carregarDesp('lixo{').intervalo===90&&L.carregarDesp(null).ligado===false,'JSON inválido/ausente => padrão');
const c=L.carregarDesp('{"ligado":true,"intervalo":77}'); ok(c.ligado&&c.intervalo===90&&c.inicio==='08:00','intervalo inválido => 90, campos faltando preenchidos');
ok(L.carregarDesp('{"intervalo":45}').intervalo===45,'intervalo 45 aceito');

describe('despertador (teste-despertador-logica.js)', () => {
  test.each(checks)('%s', (_msg, passou) => { expect(passou).toBe(true); });
});
