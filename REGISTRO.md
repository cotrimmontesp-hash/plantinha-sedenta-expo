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
