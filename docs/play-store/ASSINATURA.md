# Assinatura para a Google Play

> Nada disto foi feito ainda: **não existe chave de produção**. Este é o passo a passo para quando o Paulo for publicar.

## Como funciona (Play App Signing)
- Apps novos na Play usam obrigatoriamente o **Play App Signing**: a Google guarda a **chave de assinatura do app** e assina o que vai para os celulares [F4].
- O Paulo guarda só a **chave de upload**: ela assina o AAB que ele envia, e a Play confere que veio dele. Se a chave de upload for perdida ou vazar, dá para pedir à Play uma chave de upload nova (a chave do app continua com a Google) [F4].
- Consequência: a versão da Play terá **outra assinatura** que o APK de teste de hoje (assinado com a chave de **debug** pública do React Native). O Android não instala uma por cima da outra: é preciso desinstalar o APK de teste, e os dados locais (copos, histórico, medalhas) se perdem.

## Regras de segurança (valem para sempre)
- O arquivo da chave (`.jks` / `.keystore`) **nunca** entra no repositório. O `.gitignore` bloqueia `*.jks`, `*.keystore`, `keystore.properties`, `credentials.json`, `*service-account*.json`, `*.p12`, `*.pem`, `*.key`.
- Senha **nunca** em arquivo versionado (nem `app.json`, `eas.json`, `gradle.properties` do projeto). Use variável de ambiente, o `~/.gradle/gradle.properties` **pessoal** (fora do projeto) ou o EAS.
- Guarde a chave e a senha num gerenciador de senhas + uma cópia de segurança fora do computador.

## Caminho 1 — EAS (mais simples; precisa de conta Expo grátis)
1. `npx eas-cli login` (conta do Paulo).
2. `npx eas-cli build -p android --profile production` — na primeira vez o EAS oferece **gerar a chave** e guardá-la nos servidores da Expo (ou enviar uma que o Paulo já tenha).
3. Baixar o `.aab` e enviar na Play Console (ou `eas submit`, que precisa de uma conta de serviço da Google — não configurado).

**Versão (`versionCode`)**: hoje `eas.json` usa `"appVersionSource": "local"`, ou seja, o número vem do `app.json` (`android.versionCode`, hoje **2**). A Play recusa um AAB com `versionCode` igual ou menor que um já enviado, então **suba 1 a cada envio**.
O `autoIncrement` automático do EAS com `"appVersionSource": "remote"` guarda o contador nos servidores da Expo, então **só funciona com conta Expo** — por isso **não** foi ligado. (Também existe `autoIncrement` com fonte `local`, mas ele reescreve o `app.json` a cada build e o build no EAS também exige conta.) Quando o Paulo tiver conta, dá para trocar para `"appVersionSource": "remote"` e pôr `"autoIncrement": true` no perfil `production`.

## Caminho 2 — Gradle local (sem conta Expo)
Precisa de JDK 17 e Android SDK (como na box).

### 2.1 Criar a chave de upload (uma vez, FORA do projeto)
```bash
mkdir -p ~/chaves-android && cd ~/chaves-android
keytool -genkeypair -v -keystore plantinha-upload.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
# o keytool PERGUNTA a senha e os dados (nome, organização...). Não passe a senha na linha de comando.
```

### 2.2 Gerar o AAB assinado com a chave de upload
```bash
cd /caminho/do/projeto
CI=1 npx expo prebuild -p android --no-install   # gera android/ (fica fora do git)
git checkout package.json                         # o prebuild mexe nos scripts; desfaz

export PLANTINHA_JKS=~/chaves-android/plantinha-upload.jks
read -rs -p "Senha da chave: " PLANTINHA_SENHA; echo; export PLANTINHA_SENHA

cd android
./gradlew bundleRelease \
  "-Pandroid.injected.signing.store.file=$PLANTINHA_JKS" \
  "-Pandroid.injected.signing.store.password=$PLANTINHA_SENHA" \
  "-Pandroid.injected.signing.key.alias=upload" \
  "-Pandroid.injected.signing.key.password=$PLANTINHA_SENHA"
# resultado: android/app/build/outputs/bundle/release/app-release.aab
unset PLANTINHA_SENHA
```
- As propriedades `android.injected.signing.*` são as mesmas que o Android Studio usa no "Generate Signed Bundle". A senha vem da variável de ambiente (digitada com `read -s`): **não fica em arquivo nem no histórico** do terminal. Ela aparece por instantes na lista de processos do próprio computador (`ps`), o que é aceitável numa máquina pessoal.
- Testado na box: `ORG_GRADLE_PROJECT_android.injected...` (variável de ambiente com pontos) **não** funcionou — o AAB saiu com a chave de debug. A forma `-P` acima e `GRADLE_OPTS="-Dorg.gradle.project.android.injected.signing...=..."` funcionaram.
- Alternativa sem digitar sempre: pôr essas 4 linhas no `~/.gradle/gradle.properties` **pessoal** (pasta do usuário, fora do projeto; não testado na box). Fica a senha num arquivo local não versionado — decisão do Paulo.
- Para a Play, **não** use `-PreactNativeArchitectures=arm64-v8a` (isso foi só para o teste rápido na box): sem ele o AAB leva todas as arquiteturas.
- Conferir a assinatura: `keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab` deve mostrar no "Owner" o certificado da chave de upload, não "Android Debug".
- Depois: `rm -rf android` (a pasta é gerada e não é versionada).

Esse procedimento foi **testado na box** em 27/10/2026 com uma chave descartável criada em `/tmp` (senha aleatória só na memória) e apagada logo depois: o AAB saiu assinado por `CN=Teste Descartavel`. Nenhuma chave ficou guardada.

## Fontes
- [F4] https://support.google.com/googleplay/android-developer/answer/9842756 e https://developer.android.com/studio/publish/app-signing
- EAS: https://docs.expo.dev/build-reference/app-versions/ e https://docs.expo.dev/app-signing/app-credentials/
