// Portado de /workspace/jogos/agua/testes/teste-medalhas-logica.js (PWA v5). Mesmas verificações, agora contra src/logica/jogo.ts.
const L=require('../src/logica/jogo');
const checks=[];
const t=s=>Date.parse(s+'-03:00');let n=0;const ok=(c,msg)=>{n++;checks.push([msg,!!c]);};
const A=(e,d,g)=>L.avaliarMedalhas(e,d||L.novoDesp(),e.dia,g||{});
ok(L.MEDALHAS.length===6&&L.MEDALHAS.map(x=>x.id).join()==='gole,flor,seq3,seq7,perfeita,desp','6 medalhas fixas na ordem');
let e=L.novoEstado(t('2026-10-26T10:00:00'));
ok(A(e).length===0,'estado novo: nenhuma medalha');
L.beber(e,t('2026-10-26T10:01:00'));ok(A(e).join()==='gole','1º copo: Primeiro gole');
ok(A(e,null,{gole:'2026-10-26'}).length===0,'medalha já ganha não volta como nova');
L.desfazer(e,t('2026-10-26T10:02:00'));ok(A(e).join()==='gole','após desfazer, gole continua valendo (ultimoGole)');
e.meta=2;L.beber(e,t('2026-10-26T10:03:00'));L.beber(e,t('2026-10-26T10:04:00'));ok(A(e).join()==='gole,flor','bater meta: Flor aberta');
// avaliar não altera estado
const antes=JSON.stringify(e);A(e,{ligado:true,ligadoEm:0});ok(JSON.stringify(e)===antes,'avaliarMedalhas é pura (não altera o estado)');
// sequência
let s=L.novoEstado(t('2026-10-20T10:00:00'));s.meta=1;
for(let d=0;d<7;d++){L.beber(s,t('2026-10-20T10:00:00')+d*864e5);if(d===1)ok(!A(s).includes('seq3'),'sequência 2: sem 🔥');if(d===2)ok(A(s).includes('seq3')&&!A(s).includes('seq7'),'sequência 3: 🔥 sim, 🌟 não');}
ok(s.sequencia===7&&A(s).includes('seq7'),'sequência 7: 🌟');
ok(A(s).includes('perfeita'),'7 dias com registro e todos bateram: 🏆');
// semana perfeita não vale com 6
let p=JSON.parse(JSON.stringify(s));delete p.historico['2026-10-20'];ok(!A(p).includes('perfeita'),'6 de 7 com registro: sem 🏆');
let q=JSON.parse(JSON.stringify(s));q.historico['2026-10-22'].copos=0;ok(!A(q).includes('perfeita'),'um dia abaixo da meta: sem 🏆');
// despertador
let d=L.novoEstado(t('2026-10-26T10:00:00'));const desp=L.novoDesp();
desp.ligado=true;desp.ligadoEm=t('2026-10-26T10:05:00');ok(!A(d,desp).includes('desp'),'despertador ligado sem copo: sem ⏰');
L.beber(d,t('2026-10-26T10:00:00'));ok(!A(d,desp).includes('desp'),'copo antes de ligar: sem ⏰');
L.beber(d,t('2026-10-26T10:10:00'));ok(A(d,desp).includes('desp'),'ligado + copo depois: ⏰');
desp.ligado=false;ok(!A(d,desp).includes('desp'),'despertador desligado: sem ⏰');
// dados antigos (retroativo)
const antigo={v:1,dia:'2026-10-26',copos:0,meta:8,copoMl:250,sequencia:3,ultimoDiaMeta:'2026-10-25',seqAntes:0,diaMetaAntes:null,ultimoGole:t('2026-10-25T20:00:00')};
let o=L.carregar(JSON.stringify(antigo),t('2026-10-26T09:00:00'));ok(A(o).join()==='gole,flor,seq3','dados antigos: concede gole, flor e 🔥 retroativamente');
// carregarMedalhas
ok(JSON.stringify(L.carregarMedalhas(null))==='{}'&&JSON.stringify(L.carregarMedalhas('xx'))==='{}'&&JSON.stringify(L.carregarMedalhas('[1]'))==='{}','sem chave/ inválido: {}');
ok(JSON.stringify(L.carregarMedalhas('{"gole":"2026-10-20","zzz":"2026-10-20","flor":"ontem"}'))==='{"gole":"2026-10-20"}','carregarMedalhas mantém só ids e datas válidas');
ok(L.dataBR('2026-10-26')==='26/10/2026','data em dd/mm/aaaa');

describe('medalhas (teste-medalhas-logica.js)', () => {
  test.each(checks)('%s', (_msg, passou) => { expect(passou).toBe(true); });
});
