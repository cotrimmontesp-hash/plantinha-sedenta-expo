# 🌱 Plantinha Sedenta (Expo)

Joguinho para lembrar de beber água: cada copo faz a plantinha crescer até virar flor.
Versão Expo (React Native + TypeScript) do PWA v5 — mesma lógica, mesmo visual, mesmas chaves de dados.

## Rodar
Precisa de **Node 22.13+**.

```bash
npm install
npx expo start          # abre no celular (development build) ou na web (tecla w)
npm test                # testes da lógica (Jest, 87)
npm run typecheck       # TypeScript
npm run doctor          # expo-doctor
npm run export:web      # gera dist/ (é o que a Vercel publica)
npm run preview:web     # serve dist/ em http://localhost:4173
npm run test:web        # teste no Chrome headless a 412 px (precisa de puppeteer-core)
```

Build Android (APK de teste): `npx eas-cli build -p android --profile preview` (precisa de conta Expo).

## Estrutura
- `src/logica.ts` — regras do jogo (sem tela, testável)
- `App.tsx`, `src/components/` — telas, planta em SVG, efeitos
- `src/armazenamento.ts` — AsyncStorage (`plantinhaSedenta.v1`, `.despertador`, `.medalhas`)
- `src/notificacoes*.ts`, `src/som.ts`, `src/vibrar.ts` — despertador
- `scripts/` — gerar ícones, splash e som

## Limite
**Sem push.** O despertador toca com o app aberto. No celular ainda é agendada **uma notificação local**
para o próximo lembrete; na web só funciona com a aba aberta (ou fechada há pouco).
