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

## Lembrete com o app fechado (Android)
- `src/agenda.ts` (`horariosLembretes`) calcula **todos** os lembretes dos próximos **7 dias** (até 60), com a mesma regra do despertador do app: intervalo, janela início/fim, soneca e "conta a partir do último copo".
- `src/notificacoes.native.ts` agenda essa lista como notificações **locais** (expo-notifications), com alarme exato (`delivery: 'alarmClock'` → `AlarmManager.setAlarmClock`), canal `lembrete-agua` de importância máxima, som `assets/alarme.wav` e vibração.
- Reagenda ao abrir/voltar ao app, ao beber, quando o despertador toca, ao mudar a config ou a permissão. Desligar o despertador cancela tudo.
- Depois de reiniciar o celular, o próprio expo-notifications reagenda os avisos salvos (`RECEIVE_BOOT_COMPLETED`).
- Permissões Android: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`.
- Botão **⏱️ Testar lembrete em 1 min** (só no app Android) para testar com a tela apagada.
- APK local (sem conta Expo), na box: `npx expo prebuild -p android` e `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` (JDK 17 + Android SDK). Assinado com a chave de **debug** do template: serve para instalar direto, **não** para a Google Play.

## Limites reais
- **Celular desligado não toca** (nada toca). Ligado, com tela apagada e app fechado, toca.
- A Samsung pode atrasar ou bloquear avisos de apps "em suspensão": tire o app da economia de bateria (abaixo).
- Se o app ficar mais de 7 dias sem ser aberto, os lembretes acabam até abrir de novo.
- Se o usuário **forçar parada** do app nas configurações, o Android apaga os alarmes até abrir o app de novo.
- `USE_EXACT_ALARM` é restrita na Google Play a apps de alarme/agenda; para publicar lá, talvez seja preciso tirar e usar só `SCHEDULE_EXACT_ALARM`.
- Na **web** continua como antes: sem push, só avisa com a aba aberta (ou recém-fechada).

## Para o Paulo (no A23)
1. Baixe o arquivo `plantinha-sedenta.apk` e toque nele. Se pedir, permita **"Instalar apps desconhecidos"** para o Chrome (ou Arquivos) e toque em **Instalar**.
2. Abra o app e ligue o **⏰ Despertador**. Toque em **Permitir** nas notificações.
3. Se aparecer "Permitir alarmes", toque em **Abrir** e ative **Permitir alarmes e lembretes**. Volte para o app.
4. Tire da economia de bateria: **Configurações > Aplicativos > Plantinha Sedenta > Bateria > Sem restrições**.
5. Depois: **Configurações > Cuidados com o dispositivo > Bateria > Limites de uso em segundo plano**. Se a Plantinha estiver em "Apps em suspensão" ou "Apps em suspensão profunda", tire de lá.

### Teste no A23 (5 itens)
1. Toque em **⏱️ Testar lembrete em 1 min**, feche o app (deslize para fora dos recentes) e apague a tela. Em 1 min deve tocar e vibrar.
2. Ponha o intervalo de 30 min, feche o app e apague a tela: o lembrete do horário mostrado em "Próximo lembrete" deve tocar.
3. Beba um copo no app: o "Próximo lembrete" muda e o aviso antigo não toca.
4. Reinicie o celular, não abra o app, e espere o próximo lembrete: deve tocar.
5. Desligue o despertador e espere o horário: **não** deve tocar.

## Limite (web)
**Sem push.** Na web o despertador só funciona com a aba aberta (ou fechada há pouco).
