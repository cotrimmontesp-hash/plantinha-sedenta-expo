# 🌱 Plantinha Sedenta (Expo)

Joguinho para lembrar de beber água: cada copo faz a plantinha crescer até virar flor.
Versão Expo (React Native + TypeScript) do PWA v5 — mesma lógica, mesmo visual, mesmas chaves de dados.

## Rodar
Precisa de **Node 22.13+**.

```bash
npm install
npx expo start          # abre no celular (development build) ou na web (tecla w)
npm test                # testes da lógica (Jest, 115; 1 deles compila o Java do alarme e precisa de JDK)
npm run typecheck       # TypeScript
npm run doctor          # expo-doctor
npm run export:web      # gera dist/ (é o que a Vercel publica)
npm run preview:web     # serve dist/ em http://localhost:4173
npm run test:web        # teste no Chrome headless a 412 px (precisa de puppeteer-core)
node testes-web/prints-abas.cjs <pasta>   # prints das 4 abas a 390x844 (dados simulados)
```

Build Android (APK de teste): `npx eas-cli build -p android --profile preview` (precisa de conta Expo).

## Estrutura
```
App.tsx                 só monta o app (SafeArea + StatusBar + <Navegacao />)
index.ts                registra o app (e o service worker na web)
src/
  tipos.ts              TODOS os tipos TypeScript num lugar só
  tema.ts               cores
  navegacao/            Navegacao.tsx (raiz: 1 estado para as 4 abas + janelas), BarraAbas.tsx
                        (barra própria, fixa embaixo), abas.ts (nomes/emoji/ordem, testado no Jest)
  estado/               usePlantinha.ts: estado ÚNICO do jogo + efeitos (carregar, relógios 30 s/15 s,
                        reagendar, permissões) + ações (beber, desfazer, meta, despertador, soneca, testes)
  telas/                uma por aba: Hoje, Historico, Conquistas, Ajustes + estilos.ts
  componentes/          Botao, Planta (SVG), Efeitos (gotinha, confete), Tela (moldura da aba),
                        Mensagem, Dialogos (meta, tela do alarme, aviso de medalha)
  logica/               regras sem tela, testadas no Jest:
                        jogo.ts (copos, meta, histórico, despertador, medalhas),
                        agenda.ts (agenda de 7 dias), eventos.ts (toques no alarme nativo)
  lembretes/            despertador: notificacoes.ts (web) / notificacoes.native.ts,
                        alarmeNativo.ts (ponte para o módulo Java), som.ts, vibrar.ts
  dados/                armazenamento.ts (AsyncStorage)
modules/plantinha-alarme/   módulo nativo Android (Java/Kotlin) do alarme com o app fechado
__tests__/              Jest (115), inclusive Java x JS
testes-web/             teste no Chrome headless (42 itens) e prints
docs/play-store/        preparação para a Google Play (nada publicado)
scripts/                gerar ícones, splash e som
```
Chaves do AsyncStorage: `plantinhaSedenta.v1`, `.despertador`, `.medalhas` (iguais desde o PWA).

## Abas (v1.2.0)
4 abas fixas embaixo (proposta B): **💧 Hoje** (planta, ml de hoje / meta, "Bebi um copo", "Desfazer", próximo lembrete, sequência), **📊 Histórico** (últimos 7 dias + média), **🏅 Conquistas** (6 medalhas), **⚙️ Ajustes** (copo e meta, despertador, soneca 10 min, testes e botões ⚠️ de permissão). Se faltar permissão do alarme, a aba Hoje mostra um botão ⚠️ que leva para Ajustes. O app sempre abre em Hoje.

## Google Play
Nada publicado. O que falta e o passo a passo estão em [docs/play-store/](docs/play-store/README.md): assinatura com chave de upload, revisão das permissões (há riscos reais com `USE_EXACT_ALARM` e o serviço `mediaPlayback`), rascunhos da política de privacidade e da ficha, e a lista do que depende do Paulo.
AAB: `npx eas-cli build -p android --profile production` (conta Expo) ou Gradle local (`docs/play-store/ASSINATURA.md`).

## Alarme com o app fechado (Android, v1.1.0)
Quando o lembrete chega, o celular **toca como despertador**: som em **loop** (volume de alarme) e vibração em loop, a tela acende e a **tela de alarme abre por cima da tela bloqueada**. Só para quando o Paulo toca em **"Já bebi 💧"** (conta o copo e agenda o próximo) ou **"Daqui a pouco"** (toca de novo em 10 min). Os dois botões também ficam na notificação.

Como funciona (módulo nativo local `modules/plantinha-alarme`, entra no APK pelo autolinking do Expo; sem config plugin extra):
- `Regra.java` é uma cópia fiel das regras do despertador de `src/logica/jogo.ts` (janela, intervalo, soneca, último copo). O teste `__tests__/regraJava.test.js` compila o Java e compara com o JS (e com a agenda de 7 dias de `src/logica/agenda.ts`) em 3000 casos.
- `Agendador.java` agenda **1 alarme exato por vez** (`AlarmManager.setAlarmClock`). Ao tocar, marca o toque e já agenda o seguinte, então a agenda segue sozinha por quantos dias for, com o app fechado. Mesmos horários que a agenda de 7 dias.
- `AlarmeServico.java`: serviço em primeiro plano (`mediaPlayback`) com `MediaPlayer` em loop (`USAGE_ALARM`, som `assets/alarme.wav`), vibração em loop e wake lock. Notificação de categoria alarme, prioridade máxima, `fullScreenIntent` e 2 ações.
- `AlarmeActivity.java`: tela nativa com `showWhenLocked` e `turnScreenOn`, 2 botões grandes. Funciona sem abrir o app (não precisa de JavaScript).
- Reserva: se o Android não deixar o serviço começar, aparece uma notificação **insistente** (`FLAG_INSISTENT`, canal com som de alarme) que repete o som até tocar num botão.
- "Já bebi" e "Daqui a pouco" com o app fechado ficam gravados no celular como **eventos**. Quando o app abre (ou a cada 15 s com ele aberto), `src/logica/eventos.ts` aplica esses eventos com a lógica do app (`beber()` na hora do toque, `soneca()`), salva no AsyncStorage e confere as medalhas. Um "Já bebi" às 23h50 conta para o dia certo.
- O app manda o despertador e o último copo para o lado nativo sempre que algo muda (`sincronizarAlarme`). Com o app aberto, quem toca também é o alarme nativo (o alarme dentro do app não dispara no Android, para não tocar 2 vezes).
- Depois de **reiniciar** o celular, **atualizar** o app ou **mudar a hora**, `ReceptorBoot` agenda de novo. Ao abrir a nova versão, o app apaga os lembretes antigos do expo-notifications (APK anterior).
- Botão **⏱️ Testar lembrete em 1 min** (aba Ajustes): toca o alarme de teste (não mexe no despertador). No teste, "Já bebi" conta 1 copo de verdade (dá para desfazer) e "Daqui a pouco" toca de novo em 10 min.
- Permissões Android: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`. **Não** usa `SYSTEM_ALERT_WINDOW` (continua bloqueada).
- iOS/web: sem mudança (iOS usa as notificações do expo-notifications; web como o PWA).
- APK local (sem conta Expo), na box: `npx expo prebuild -p android` e `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` (JDK 17 + Android SDK). Assinado com a chave de **debug** do template (a mesma do APK anterior, por isso instala por cima): serve para instalar direto, **não** para a Google Play.

## Limites reais
- **Celular desligado não toca** (nada toca). Ligado, com tela apagada ou bloqueada e app fechado, toca.
- **Android 14+**: a tela cheia precisa da permissão "Notificações em tela cheia". O app mostra **⚠️ Permitir alarme em tela cheia** se ela estiver desligada. Sem ela, o som continua em loop e os botões ficam na notificação, mas a tela não abre sozinha.
- **"Alarmes e lembretes"** desligado: o Android pode atrasar o alarme (o app mostra ⚠️ Permitir alarmes na hora certa).
- Com a tela **ligada e desbloqueada** usando outro app, o Android mostra o alarme como aviso no topo (com os 2 botões), não em tela cheia. É regra do Android.
- **Samsung/One UI**: economia de bateria e "Apps em suspensão" podem atrasar ou matar o alarme: tire o app da economia (abaixo). Se o celular pedir **"Exibir sobre outros apps"**, permita (o app não pede essa permissão, mas algumas versões da One UI perguntam).
- **Não Perturbe**: na Samsung, os **alarmes** tocam no Não Perturbe por padrão ("Alarmes" ligado nas exceções). Se ele estiver desligado lá, o som não sai.
- **Volume**: usa o **volume de alarme** do celular. Volume de alarme no zero = só vibra.
- O alarme toca até responder, sem limite de tempo. Se o Android matar o serviço, ele volta (`START_STICKY`).
- "Daqui a pouco" perto do fim da janela (ex.: 19h55 com fim às 20h) cai fora do horário e vai para o início da janela do dia seguinte (mesma regra da soneca do app).
- Se o usuário **forçar parada** do app nas configurações, o Android apaga os alarmes até abrir o app de novo.
- `USE_EXACT_ALARM` e `USE_FULL_SCREEN_INTENT` são restritas na Google Play a apps de alarme/agenda; para publicar lá, ver `docs/play-store/PERMISSOES.md`.
- Na **web** continua como antes: sem push, só avisa com a aba aberta (ou recém-fechada).

## Para o Paulo (no A23)
1. Baixe o APK mais novo (`plantinha-sedenta-abas.apk`, v1.2.0) e toque nele. Toque em **Atualizar** (instala por cima, seus copos ficam). Se pedir, permita **"Instalar apps desconhecidos"** para o Chrome (ou Arquivos).
2. Abra o app. Se o despertador estiver desligado, ligue o **⏰ Despertador** (aba **⚙️ Ajustes**). Permita tudo que o celular pedir: **notificações**, **alarmes e lembretes** e **tela cheia**.
3. Se aparecer um botão **⚠️** (na aba Hoje ou em Ajustes > Despertador), toque nele e ative o que ele pedir. Volte para o app.
4. Tire da economia de bateria: **Configurações > Aplicativos > Plantinha Sedenta > Bateria > Sem restrições**.
5. Depois: **Configurações > Cuidados com o dispositivo > Bateria > Limites de uso em segundo plano**. Se a Plantinha estiver em "Apps em suspensão" ou "Apps em suspensão profunda", tire de lá.
6. Suba o **volume de alarme** (botão de volume > ⋮ ou ⚙️ > Alarme).

### Teste no A23 (6 itens)
1. Em **⚙️ Ajustes**, toque em **⏱️ Testar lembrete em 1 min**, saia do app e **apague a tela**. Em 1 min a tela deve acender com "Hora de beber água!", tocando sem parar.
2. Espere uns 30 s: deve continuar tocando. Toque em **Já bebi 💧**: o som para. Abra o app: tem 1 copo a mais.
3. Toque de novo em **⏱️ Testar lembrete em 1 min**, apague a tela e, quando tocar, toque em **Daqui a pouco**. O som para e **toca de novo em 10 min**. Responda **Já bebi**.
4. Com o despertador ligado e o app fechado, espere o horário de "Próximo lembrete": deve tocar igual.
5. **Reinicie** o celular, não abra o app, e espere o próximo lembrete: deve tocar.
6. Desligue o despertador e espere o horário: **não** deve tocar.

## Limite (web)
**Sem push.** Na web o despertador só funciona com a aba aberta (ou fechada há pouco).
