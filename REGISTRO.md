# REGISTRO — migração Plantinha Sedenta → Expo

Data: 27/10/2026 (America/Sao_Paulo). Origem: PWA v5 em /workspace/jogos/agua/pwa/index.html (não alterado; repo atual não tocado).

## Versões
- expo 58.0.19
- react-native 0.88.0
- react 19.3.0
- typescript 6.0.3
- react-native-web 0.21.4
- jest 30.5.2
- jest-expo 58.0.12
- @react-native-async-storage/async-storage 2.2.0
- react-native-svg 15.16.0
- expo-audio 58.0.10
- expo-notifications 58.1.6
- Node usado: 22.23.4 (o Node 20 da box é velho para o Expo 58; `engines.node >=22.13.0`)

## Decisões
- Trabalho local na box (o brief pede a pasta /workspace/jogos/agua-expo, sem repo) em vez de agente na nuvem.
- `Logica` portada para `src/logica.ts` com as mesmas funções/constantes; testes do PWA portados para Jest (`__tests__/`).
- Mesmas estruturas e chaves de AsyncStorage do localStorage do PWA.
- Horário de início/fim do despertador: botões −/+ de 15 em 15 min (RN não tem campo de hora nativo).
- Fundo do palco liso (#14344b) em vez de degradê; animação "desabrocha" da flor não portada (gotinha e confete sim).
- Placar numa linha só (fonte menor em textos longos, como o nowrap do PWA).
- Nativo: uma notificação local agendada para o próximo lembrete (expo-notifications, sem push/remoto). Web: Notification via service worker, como no PWA.
- Permissões Android: só VIBRATE (+ as do expo-notifications); bloqueadas RECORD_AUDIO, armazenamento, SYSTEM_ALERT_WINDOW.
- Ícones gerados por `scripts/gerar-icones.cjs` (puppeteer) + `scripts/tirar-alpha.py`; som por `scripts/gerar-som.py`.
- AGENTS.md e LICENSE do template removidos.

## Testes (rodados de verdade)
- `tsc --noEmit`: OK
- Jest: **87/87** (logica 31, historico 15, medalhas 21, despertador 20) — também OK com TZ=UTC e TZ=Asia/Tokyo. Os originais dão 87 no PWA.
- expo-doctor: **20/20**, sem avisos (após instalar expo-asset, peer do expo-audio).
- `expo export -p web`: OK (dist ≈1,0 MB, bundle JS 690 KB). Export Android (Hermes) também empacota.
- `expo prebuild` Android validado (pasta apagada depois).
- Web headless Chrome 412×915: **35/35** (beber, desfazer, meta, histórico, medalhas, diálogo 500 ml, despertador, soneca, alarme vencido, persistência, PWA instalável, SW, sem erros). Dados de semana e de planta murcha são **[SIMULADO]**.
- Prints: testes-web/telas/00-vercel.png, 01-inicio.png … 06-murcha-SIMULADO.png.
- Ícone sem alpha: assets/icon.png 1024×1024 RGB.

## Vercel
- Criado projeto **novo** `plantinha-sedenta-expo` (conta cotrimmontesp-6833) via CLI, sem GitHub; nenhum projeto existente afetado.
- O 1º deploy de projeto novo foi como **produção**: https://plantinha-sedenta-expo.vercel.app (público, abre OK, verificado no Chrome headless). Ainda não ligado ao GitHub.
- `.vercel/` e `.env.local` (token OIDC criado pela CLI) estão no .gitignore.

## O que falta
- Repo no GitHub (Paulo cria), colaborador mmontesly, ligar Vercel ao GitHub.
- Build APK (EAS, precisa de conta Expo) e instalar no Samsung A23; print do app instalado.
- Dados do PWA antigo (github.io) não migram: origem diferente.

## Passos do Paulo
1. Criar o repo vazio em https://github.com/new com o nome `plantinha-sedenta-expo` (sem README, sem .gitignore).
2. Em https://github.com/cotrimmontesp-hash/plantinha-sedenta-expo/settings/access adicionar **mmontesly** (no Chrome do celular use "Site para computador").
3. Instalar o app Vercel: https://github.com/apps/vercel/installations/new → "Only select repositories" → escolher o repo.
4. Depois um agente faz: `git remote add origin <url> && git push -u origin main` e `vercel git connect <url>`.
5. Para o APK: criar conta em https://expo.dev e rodar `npx eas-cli build -p android --profile preview`.

## 27/10/2026 — Lembrete com o app fechado (branch `feature/lembretes-fechado`)
Pedido: Paulo autorizou (via Coordenador de Apps) o lembrete tocar com o app fechado e a tela apagada no Android, e gerar o APK.
- Base: `main` do GitHub (e7bcfd3, merge do PR #1; árvore idêntica a 919b90b local).
- `src/agenda.ts`: `horariosLembretes(desp, ultimoGole, agora)` → todos os lembretes dos próximos 7 dias (teto 60), mesma regra do despertador do app (intervalo, janela, soneca, último copo). Testes novos em `__tests__/agenda.test.js` (13).
- `src/notificacoes.native.ts`: agenda a lista inteira (ids `lembrete-<ms>`), alarme exato `delivery: 'alarmClock'`, canal `lembrete-agua` (importância MAX, som `alarme.wav`, vibração, visível na tela bloqueada); apaga o canal antigo `despertador`. Pede notificações e, se faltar, "Alarmes e lembretes" com explicação em português. Botão "⏱️ Testar lembrete em 1 min" (só Android/iOS).
- `App.tsx`: reagenda quando muda ligado/intervalo/início/fim/soneca/último toque/último copo/permissões e ao voltar para o app. Web inalterada (funções vazias em `src/notificacoes.ts`).
- `app.json`: permissões POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED; plugin expo-notifications com `sounds: ["./assets/alarme.wav"]`.
- Reboot: o expo-notifications já tem receiver de BOOT_COMPLETED/MY_PACKAGE_REPLACED que reagenda os avisos salvos.
- Decisão: som do canal no fluxo normal de notificação (não no volume de alarme), para respeitar o modo silencioso.
- Commits com autor `cotrimmontesp-hash <348075526+cotrimmontesp-hash@users.noreply.github.com>` (config local do repo).

### APK
- Compilado na box, sem EAS e sem conta Expo: Temurin JDK 17 (/home/box/jdk17), Android SDK (/home/box/android-sdk: platform 37.0, build-tools 37.0.0, NDK 27.1, CMake 3.22.1), swap de 10 GB.
- `npx expo prebuild -p android` + `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` (só arm64: o A23 é arm64). BUILD SUCCESSFUL em ~4 min.
- Assinado com a chave de **debug** do template (CN=Android Debug): só para instalação direta, não serve para a Google Play.
- Pasta `android/` apagada depois (o projeto continua "managed").
- Arquivo: `/workspace/jogos/agua-expo-entrega/plantinha-sedenta.apk` — 26.313.395 bytes, sha256 `d26d29e60ad671134ad4f87c7c925a48557c522f0e702fba12fc099692498073`, minSdk 24, targetSdk 36, arm64-v8a. Conferido com aapt2: permissões acima e `raw/alarme` dentro do APK.
- **Não testado em aparelho**: tentei um emulador Android 14 x86_64 na box, mas ele não chegou a ligar (ficou "offline"). O teste real é o checklist do README no A23.

### Testes (rodados de verdade)
- `tsc --noEmit`: OK
- Jest: **100/100** (87 antigos + 13 da agenda)
- expo-doctor: 20/20
- `expo export -p web`: OK; teste web no Chrome headless: 35/35 (comportamento web igual)
- `expo prebuild -p android`: AndroidManifest com POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED, VIBRATE e o receiver de boot do expo-notifications; som em `res/raw/alarme.wav`. O canal `lembrete-agua` é criado pelo app ao rodar (não fica no manifest).

## 27/10/2026 — Alarme em loop com tela cheia (branch `feature/alarme-tela-cheia`, v1.1.0 / versionCode 2)
Pedido: Paulo pediu (via Coordenador de Apps) que o lembrete toque como alarme de celular: som em loop até responder, tela acendendo por cima da tela bloqueada, e só parar com "Já bebi" ou "Daqui a pouco" (10 min).
- Base: `main` do GitHub (1417f1d, merge do PR #2; árvore igual à `feature/lembretes-fechado`).
- Decisão: módulo nativo local (`modules/plantinha-alarme`, Java + ponte Kotlin do Expo, autolinking) em vez de só expo-notifications. Motivo: expo-notifications não tem `fullScreenIntent` nem som em loop; `FLAG_INSISTENT` sozinho para quando abre a cortina de notificações. O módulo tem AlarmManager exato → receptor → serviço em primeiro plano com MediaPlayer em loop (USAGE_ALARM) + vibração em loop → notificação de alarme com tela cheia e 2 ações → Activity `showWhenLocked`/`turnScreenOn`. Reserva: notificação insistente se o serviço não puder começar.
- Lógica: `Regra.java` copia as regras de `src/logica.ts`; `__tests__/regraJava.test.js` compila e compara com o JS e com a agenda de 7 dias em 3000 casos (mutação no Java faz o teste falhar: conferido). O nativo agenda 1 alarme por vez e encadeia (mesmos horários da agenda de 7 dias, sem limite de dias).
- Respostas com o app fechado viram eventos no celular; `src/eventos.ts` (`aplicarEventos`, `carregarComEventos`) aplica com `beber()`/`soneca()`/`marcarToque()` do app ao abrir e a cada 15 s. Testes novos em `__tests__/eventos.test.js` (11).
- App: no Android o alarme do app não dispara (quem toca é o nativo); se o nativo estiver tocando e o app estiver aberto, a tela de alarme do app aparece e os botões param o nativo. Botão ⚠️ "Permitir alarme em tela cheia" (Android 14+). Remove os avisos antigos do expo-notifications ao abrir. Web e iOS sem mudança.
- Reboot / atualização / mudança de hora: `ReceptorBoot` agenda de novo (só depois de o app ter sido aberto 1 vez na versão nova).
- `app.json`: versão 1.1.0, versionCode 2; permissões novas USE_FULL_SCREEN_INTENT, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, WAKE_LOCK. SYSTEM_ALERT_WINDOW continua bloqueada.

### Testes (rodados de verdade)
- `tsc --noEmit`: OK
- Jest: **112/112** (100 antigos + 11 eventos + 1 paridade Java×JS com 3000 casos)
- expo-doctor: 17/18 — a única falha é "expo 58.0.19, esperado ~58.0.20" (patch novo publicado; a mesma falha aparece na `main` sem as mudanças). Não atualizei para não mexer em dependência.
- `expo export -p web`: OK; teste web no Chrome headless: **35/35** (web igual).
- `expo prebuild -p android` + manifest final do APK (aapt2): USE_FULL_SCREEN_INTENT, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, WAKE_LOCK, SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM, POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED; AlarmeActivity (showWhenLocked, turnScreenOn), AlarmeServico (foregroundServiceType mediaPlayback), Receptor, ReceptorBoot (BOOT_COMPLETED, MY_PACKAGE_REPLACED, TIME_SET, TIMEZONE_CHANGED); `raw/alarme` e `drawable/notification_icon` presentes.

### APK
- `/workspace/jogos/agua-expo-entrega/plantinha-sedenta-alarme.apk` — 26.339.667 bytes, sha256 `87b9f315df6a8b15f2e8b2f70c53529211e8ac8663ae73cba71e873ba1b656d2`, versionName 1.1.0, versionCode 2, arm64-v8a, minSdk 24, targetSdk 36.
- Assinatura: mesma chave de debug do APK anterior (certificado SHA-256 `fac61745…033b9c` nos dois, conferido com apksigner), então instala por cima sem desinstalar.
- **Não testado em aparelho**: tentei de novo o emulador Android 14 x86_64 da box (KVM disponível), mas ele ficou "offline" e parado (CPU ~0%), igual à vez anterior. O teste real é o checklist do README no A23.

## 27/10/2026 — Organização do código + preparação para a Google Play (branch `refactor/organizacao-play-store`, v1.1.0 / versionCode 2)
Pedido: Paulo (via Coordenador de Apps): (A) código mais organizado e (D) arquitetura pronta para a Play Store, **sem mudar o comportamento**. Nada publicado, nenhuma conta criada, nada de deploy, APK antigo não substituído.
- Base: `0a19d58` (main). Trabalho local na box (precisa do JDK/SDK e da chave de debug da box para o APK; entrega por bundle + patches, sem push).
- Commits: (1) `src/` em pastas `logica/`, `lembretes/`, `dados/`, `componentes/` (só move e ajusta imports); (2) `App.tsx` separado em `src/telas/Jogo.tsx` + `Jogo.estilos.ts` + `src/componentes/Botao.tsx` (diff das linhas ordenadas: só imports/exports mudaram); (3) tipos em `src/tipos.ts` (reexportados pelos módulos de antes); (4) código morto removido: `assinatura()` da agenda (só o teste a usava, teste removido junto) e o estilo vazio `palcoMurcho`; (5) `docs/play-store/` + `.gitignore` para chaves; (6) README/REGISTRO.
- **Nativo não mexido**: `git diff 0a19d58 -- modules plugins app.json eas.json package.json` vazio. `eas.json` já gerava AAB no `production`; `autoIncrement` remoto não ligado (precisa de conta Expo; explicado em ASSINATURA.md).
- Comentário em `Regra.java` ainda cita `src/logica.ts` (agora `src/logica/jogo.ts`) — não editei para não tocar no nativo.

### Testes (rodados de verdade, na árvore final)
- `tsc --noEmit --noUnusedLocals`: OK
- Jest: **111/111** (era 112; saiu só o teste da `assinatura()` removida). `regraJava` (Java × JS) passa.
- expo-doctor: 17/18 (só o aviso conhecido expo 58.0.19 × 58.0.20; não atualizei).
- `expo export -p web`: OK; teste web headless: **35/35**.
- `expo prebuild -p android`: `AndroidManifest.xml` **idêntico** ao de antes da refatoração (`diff` vazio) e os 16 arquivos gradle/properties/xml gerados com o mesmo sha256.
- APK novo × APK 1.1.0 anterior: manifesto final (`aapt2 dump xmltree`) **idêntico**; mesmo certificado de debug (SHA-256 `fac61745…033b9c`); package, versionName 1.1.0, versionCode 2, minSdk 24, targetSdk 36 iguais.
- Assinatura com chave de upload testada com chave descartável em `/tmp` (apagada): `-Pandroid.injected.signing.*` e `GRADLE_OPTS` funcionam; `ORG_GRADLE_PROJECT_android.injected...` não.

### Arquivos (em /workspace/jogos/agua-expo-entrega/)
- `plantinha-sedenta-organizado.apk` — 26.341.139 bytes, sha256 `3a484314a18c3f26bc7fcc1425709245f639a2a82c7bda14061674a446e400ef`, arm64-v8a, chave de debug (instala por cima do 1.1.0).
- `plantinha-sedenta-organizado-NAO-PUBLICAVEL.aab` — 22.417.085 bytes, sha256 `d23ea662677959d44dde5e617fa099577b902cc65dbc6fa453f65d973182ef58`, assinado com a chave de **debug** (`CN=Android Debug`), só arm64-v8a: **não serve para a Play**, só prova que o build de produção funciona.
- O APK anterior `plantinha-sedenta-alarme.apk` continua lá, intacto (sha256 `87b9f315…56d2`).
- **Não testado em aparelho** (o emulador da box não ligou nas 2 tentativas anteriores; não tentei de novo). Checklist do A23 no README.

## 27/10/2026 — Navegação por 4 abas (proposta B aprovada pelo Paulo) — branch `feature/navegacao-abas`, v1.2.0 / versionCode 3
Pedido: Paulo (via Coordenador de Apps) aprovou a proposta B: 4 abas fixas embaixo (💧 Hoje, 📊 Histórico, 🏅 Conquistas, ⚙️ Ajustes), dividindo `src/telas/Jogo.tsx`. **Sem mudar** comportamento, lógica, dados, alarme nativo, permissões ou `eas.json`. Nada publicado, sem deploy na Vercel.
- Base: `7499f28` (main do GitHub, já com o PR 4). Trabalho local na box (JDK/SDK + chave de debug da box para o APK); entrega por bundle + patches, sem push.
- **Escolha da navegação: barra de abas própria** (`src/navegacao/BarraAbas.tsx`, estado `useState` em `Navegacao.tsx`), sem React Navigation/Expo Router.
  Motivo: 4 abas fixas sem histórico/links não precisam de biblioteca; zero dependência nova = nada muda no `package.json`, no prebuild, no APK e no export web (manifesto igual, expo-doctor igual).
- Estado ÚNICO em `src/estado/usePlantinha.ts` (1 hook chamado só em `Navegacao.tsx`; as telas recebem `p` por prop). O código veio de `Jogo.tsx`: conferido por script que todas as linhas de estado/efeitos/ações (linhas 18–226) estão idênticas no código novo; as 7 que mudaram são só de tela (tamanho da planta/placar, nome do componente, `semana`/`nGanhas` movidos para as abas).
- Janelas (meta, tela do alarme, aviso de medalha) ficam na raiz: aparecem em qualquer aba. A frase do momento aparece em Hoje e em Ajustes. Os botões ⚠️ de permissão ficam em Ajustes > Despertador (como antes) e, se faltar permissão, Hoje mostra um ⚠️ que leva a Ajustes.
- Safe area: `SafeAreaView` só em cima/lados; a barra de abas soma o `inset` de baixo (fica acima da barra de navegação do Android). Botões das abas com 66 px de altura.
- Cores: telas no tema escuro de sempre; barra de abas nas cores da proposta B (fundo claro, aba ativa verde com borda verde em cima). Nomes e emoji das abas iguais à proposta. O app sempre abre em Hoje.
- Hoje: planta um pouco menor (30% da altura em vez de 42%) para a aba caber sem rolar em 390×844; progresso "1250 ml / 2000 ml" + "5/8 copos hoje" no lugar das 3 caixinhas.
- **Não mexido** (conferido com `git diff 7499f28 --stat -- src/logica src/dados src/lembretes modules plugins eas.json package.json package-lock.json`: vazio; não existe pasta `plugins/`). `app.json`: só `version` 1.2.0 e `versionCode` 3.

### Testes (rodados de verdade, na árvore final)
- `tsc --noEmit --noUnusedLocals`: OK
- Jest: **115/115** (111 de antes + 4 novos de `src/navegacao/abas.ts`). Sem infraestrutura de teste de renderização no projeto; não adicionei.
- expo-doctor: 17/18 (só o aviso conhecido expo 58.0.19 × 58.0.20; não atualizei).
- `expo export -p web`: OK. Teste web headless (412 px): **42/42** = os 35 de antes + 7 novos das abas. Adaptação: cada verificação antiga é a mesma, só troca de aba antes de ler o texto (`hResumo` no Histórico, `mResumo` em Conquistas, `config`/`dLiga`/`dProx`/`msg` dos ajustes em Ajustes, `copos`/`ml`/`seq` em Hoje), porque só a aba aberta fica na tela. Novos: 4 abas aparecem; barra fixa embaixo com botões ≥ 56 px e abre em Hoje; "Bebi um copo" visível sem rolar; trocar de aba mantém o estado; Ajustes mostra a meta salva; Hoje mostra o próximo lembrete; recarregar mantém o histórico.
- Prebuild: `AndroidManifest.xml` gerado **idêntico** ao da main; `build.gradle` muda só `versionCode 3` / `versionName "1.2.0"`. Manifesto final do APK (aapt2) × `plantinha-sedenta-organizado.apk`: só `versionCode`/`versionName` mudam.

### APK
- `/workspace/jogos/agua-expo-entrega/plantinha-sedenta-abas.apk` — 26.351.355 bytes, sha256 `a3f410bea40cc01ac482b77f22f833e89d8967214436b220e7c65bc7bb6beefc`, package `br.com.minanoideias.plantinhasedenta`, 1.2.0 / versionCode 3, arm64-v8a, mesma chave de debug (certificado SHA-256 `fac61745…033b9c`, igual ao `plantinha-sedenta-organizado.apk`): instala por cima sem perder dados.
- **Não testado em aparelho** (o emulador da box travou nas 2 vezes anteriores; não tentei de novo). Checklist do A23 no README ("Teste das abas no A23").
- Prints da web a 390×844 com **dados simulados**: `/workspace/jogos/agua-expo-entrega/prints-abas/` (gerados por `testes-web/prints-abas.cjs`).
