# ⚠️ RASCUNHO — Política de Privacidade da Plantinha Sedenta

> **RASCUNHO, não publicado.** Precisa ser revisado pelo Paulo e publicado numa URL pública antes de enviar à Play.
> Lacunas entre colchetes: **[NOME DO DESENVOLVEDOR]**, **[E-MAIL DE CONTATO]**, **[URL DESTA POLÍTICA]**, **[DATA]**.
> Cada frase abaixo foi conferida no código da versão 1.1.0 (lista no fim). Se o app mudar (anúncios, conta, nuvem, estatísticas), esta política **tem que mudar junto**.

---

**Plantinha Sedenta — Política de Privacidade**
Última atualização: [DATA]
Responsável: [NOME DO DESENVOLVEDOR] — contato: [E-MAIL DE CONTATO]

**Resumo:** a Plantinha Sedenta não coleta, não envia e não vende nenhum dado seu. Tudo o que você registra fica só no seu celular.

**1. O que o app guarda, e onde**
O app guarda **apenas no seu aparelho**:
- quantos copos você bebeu hoje, o tamanho do copo e a sua meta;
- o histórico dos últimos 30 dias e a sequência de dias;
- as configurações do despertador (ligado/desligado, horários e intervalo);
- as medalhas conquistadas;
- os toques em "Já bebi" e "Daqui a pouco" feitos na tela do alarme, até o app aplicá-los.

Esses dados não saem do aparelho pelo app. Não há conta, login, nome, e-mail, localização, contatos, fotos, microfone nem identificador de publicidade.

**2. O que o app envia pela internet**
Nada. O app não tem servidor próprio, não usa estatísticas de uso (analytics), não mostra anúncios e não recebe notificações pela internet. Os lembretes são agendados no próprio celular.

**3. Backup do Android**
Se você ativou o backup do Google no seu celular, o próprio Android pode incluir os dados do app no seu backup pessoal, conforme as configurações e a política do Google. O app não controla nem acessa esse backup.

**4. Versão web**
Na versão web, os mesmos dados ficam guardados só no navegador (armazenamento local). O site é hospedado por um provedor de hospedagem, que pode registrar dados técnicos de acesso (como endereço IP) conforme a política dele. O app em si não envia seus registros a nenhum servidor.

**5. Permissões usadas no Android**
- Notificações, alarmes exatos, tela cheia, serviço em primeiro plano, manter a tela acordada, vibrar e iniciar após reiniciar: para tocar o lembrete de beber água na hora certa, inclusive com a tela bloqueada.
- Internet: vem por padrão na tecnologia usada (React Native); o app não a usa para enviar dados.
O app não pede microfone, armazenamento de arquivos nem "exibir sobre outros apps".

**6. Saúde**
A meta de copos é só uma referência ajustável e **não é orientação médica**. O app não é um dispositivo médico. Na dúvida sobre quanta água beber, converse com um profissional de saúde.

**7. Crianças**
[PAULO DECIDE o público-alvo na Play Console. O app não coleta dados de ninguém, inclusive de crianças.]

**8. Como apagar seus dados**
Desinstale o app ou, no Android, vá em Configurações > Apps > Plantinha Sedenta > Armazenamento > Limpar dados. Na web, limpe os dados do site no navegador.

**9. Mudanças**
Se esta política mudar, a nova versão será publicada em [URL DESTA POLÍTICA] com a data atualizada.

**10. Contato**
[E-MAIL DE CONTATO]

---

## O que foi conferido no código (27/10/2026, branch `refactor/organizacao-play-store`)
| Afirmação | Como foi conferido |
|---|---|
| Sem chamadas de rede no app | `grep` por `fetch`, `XMLHttpRequest`, `WebSocket`, `axios`, `http` em `App.tsx`, `index.ts`, `src/` e no módulo nativo (`modules/plantinha-alarme`): nenhuma chamada. O único `fetch` é do `public/sw.js` (cache offline da web, só arquivos do próprio site). |
| Sem analytics/anúncios/Firebase no código | `package.json` sem SDK de analytics, anúncios ou crash report; `grep` sem `analytics`, `admob`, `firebase` no código do app. (O manifesto final tem metadados do `expo-notifications` sobre Firebase, mas `enableRemoteNotifications` está `false` e não há pedido de token de push no código.) |
| Dados só no aparelho | App: AsyncStorage, chaves `plantinhaSedenta.v1`, `plantinhaSedenta.despertador`, `plantinhaSedenta.medalhas` (`src/dados/armazenamento.ts`). Nativo: `SharedPreferences` em `MODE_PRIVATE` (configuração do alarme e eventos dos botões). |
| Histórico de 30 dias | `registrar()` em `src/logica/jogo.ts` apaga dias além dos 30 mais recentes. |
| Sem conta/login | Não há tela, biblioteca ou código de login. |
| Backup do Android | `android:allowBackup="true"` no manifesto final (padrão do Expo). |
| Permissões | Manifesto final do APK (`aapt2 dump xmltree`); `blockedPermissions` em `app.json`. |
| Aviso de saúde | Já existe no app: "A meta é só uma referência ajustável, não é orientação médica. Na dúvida, converse com seu médico." (`src/telas/Ajustes.tsx`). |

**Para o formulário "Segurança dos dados" da Play:** pelo código conferido, a resposta coerente é "o app não coleta nem compartilha dados do usuário" (dados que ficam só no aparelho não contam como coletados, segundo a Play [F7]). O Paulo confirma ao preencher.
**Não conferido:** quais registros de acesso a hospedagem da web (Vercel) guarda — depende do provedor.
