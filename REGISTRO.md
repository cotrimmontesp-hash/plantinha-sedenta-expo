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
