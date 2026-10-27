# Google Play — preparação (NADA foi publicado)

Pasta com o que precisa para publicar a Plantinha Sedenta na Google Play **depois**, quando o Paulo decidir.
Nenhuma conta foi criada, nada foi enviado à Play, nenhuma chave de produção existe ainda.

| Arquivo | O que tem |
|---|---|
| [ASSINATURA.md](ASSINATURA.md) | Chave de upload, Play App Signing, gerar o AAB (EAS ou Gradle local, senha só em variável de ambiente) |
| [PERMISSOES.md](PERMISSOES.md) | Cada permissão Android, a justificativa honesta para a Play Console, riscos reais de recusa e alternativas |
| [POLITICA_PRIVACIDADE.md](POLITICA_PRIVACIDADE.md) | **RASCUNHO** da política de privacidade (com o que foi conferido no código) |
| [FICHA_LOJA.md](FICHA_LOJA.md) | **RASCUNHO** do título, descrições e notas da versão em pt-BR |
| `graficos/icone-512.png` | Ícone 512×512 PNG para a ficha (redução do `assets/icon.png`) |

## Já pronto no projeto
- `eas.json` (já estava assim, não mudou), perfil `production`: gera **AAB** (`"buildType": "app-bundle"`). Perfil `preview` continua gerando APK.
- `app.json`: nome, pacote `br.com.minanoideias.plantinhasedenta`, `version` 1.1.0, `versionCode` 2 (subir 1 a cada envio à Play; ver ASSINATURA.md).
- SDK alvo do build atual: **targetSdk 36** (Android 16), o mínimo exigido para apps novos desde 31/08/2026 [F5]. minSdk 24.
- `.gitignore` bloqueia `*.jks`, `*.keystore`, `keystore.properties`, `credentials.json` (EAS), `*service-account*.json`, `*.p12`, `*.pem`, `*.key`.
- Teste de build: um AAB foi gerado na box e assinado só com a chave de **debug** (`plantinha-sedenta-organizado-NAO-PUBLICAVEL.aab`) para provar que o build de produção funciona. **Não serve para a Play.**

## O que depende do Paulo (conferido nas regras da Play em 27/10/2026)
1. **Conta de desenvolvedor** Google Play: taxa única de **US$ 25**, escolher conta **pessoal** ou de **organização**, verificar identidade com documento oficial [F1][F2]. (Se a Minano Ideias tiver CNPJ, conta de organização evita o item 2; a decisão é do Paulo.)
2. **Conta pessoal criada depois de 13/11/2023**: antes de publicar, **teste fechado com pelo menos 12 testadores** inscritos **por 14 dias seguidos**, depois pedir acesso à produção no Painel [F3]. A página da Play descreve essa exigência só para contas **pessoais** [F3].
3. **Chave de upload**: gerar e guardar (ver ASSINATURA.md). Se perder, dá para pedir troca da chave de upload ao suporte, mas não é instantâneo [F4].
4. **Ficha da loja** [F6]: ícone 512×512 PNG 32 bits (≤1 MB) — rascunho em `graficos/`; **gráfico de destaque 1024×500** JPEG/PNG 24 bits sem transparência — **falta criar**; **capturas de tela do celular**: mínimo 2, máximo 8, JPEG/PNG 24 bits, lados entre 320 e 3840 px — **tirar no A23** (as de `testes-web/telas` são da web e algumas têm dados SIMULADOS: não usar).
5. **Conteúdo do app (Play Console > Monitorar e melhorar > Conteúdo do app)**:
   - **Política de privacidade**: URL pública — o rascunho está aqui; precisa ser publicada num endereço (ex.: uma página no site da Minano) [F7][F8].
   - **Segurança dos dados** (Data safety): obrigatório para todo app, mesmo sem coletar nada [F7]. Pelo código conferido: nenhum dado coletado nem compartilhado (ver POLITICA_PRIVACIDADE.md).
   - **Classificação de conteúdo** (questionário IARC) — responder na Console.
   - **Público-alvo** e **anúncios** (o app não tem anúncios).
   - **Apps de saúde**: declaração obrigatória para todos os desenvolvedores; o Paulo escolhe se o app tem recursos de saúde (acompanhar água bebida provavelmente conta). Se marcar que sim, a Play pede **link da política de privacidade também dentro do app** — o app **ainda não tem** esse link (mudança de tela, não feita) [F8]. O aviso "não é orientação médica" **já existe** no app.
   - **Declarações de permissões**: alarme exato, tela cheia e serviço em primeiro plano (com **vídeo** mostrando o recurso) — textos em PERMISSOES.md [F9][F10].
6. **Decisões de texto**: o app tem frases com o nome "Paulo" ("Isso aí, Paulo! 💧", "Ei, Paulo, a plantinha está com sede"). Para a loja pública, decidir se troca por frases sem nome (não mudei: seria mudança de comportamento).
7. **Fuso horário fixo**: dias e horários do app usam sempre `America/Sao_Paulo` (`src/logica/jogo.ts` e `Regra.java`). Para quem mora em outro fuso (ex.: Manaus, Portugal) os lembretes tocariam na hora errada. Decidir se publica só no Brasil ou se corrige antes (não mexi).
8. **Contato**: e-mail de suporte, nome do desenvolvedor, site (lacunas nos rascunhos).

## Atenções
- **O APK atual do Paulo (chave de debug) não atualiza para a versão da Play.** Na Play o app é assinado pela chave da Google (Play App Signing) [F4]; o Android não instala por cima de um app com outra assinatura. Para trocar, precisa **desinstalar** o APK de teste, e os **copos, histórico e medalhas** (guardados só no celular) **se perdem**. O app não tem exportar/importar dados (não implementado).
- **Verificação de desenvolvedor Android**: desde 30/09/2026 vale no Brasil para instalações vindas de lojas participantes (Google Play, Galaxy Store etc.); em 2027 a Google pretende ampliar para todos os apps em aparelhos certificados [F11]. Quem publica pela Play é registrado automaticamente [F11]. Sideload de app não registrado continua possível pelo "fluxo avançado" (com etapas extras de segurança) e o ADB continua igual; há também a "distribuição limitada" (até 20 aparelhos, sem verificação de identidade) [F11]. Pode deixar mais trabalhosa a instalação do APK de debug no futuro.

## Fontes (lidas em 27/10/2026)
- [F1] Get started with Play Console — https://support.google.com/googleplay/android-developer/answer/6112435
- [F2] Verify your developer identity — https://support.google.com/googleplay/android-developer/answer/10841920
- [F3] App testing requirements for new personal developer accounts — https://support.google.com/googleplay/android-developer/answer/14151465
- [F4] Use Play App Signing — https://support.google.com/googleplay/android-developer/answer/9842756 ; Sign your app — https://developer.android.com/studio/publish/app-signing
- [F5] Target API level requirements — https://support.google.com/googleplay/android-developer/answer/11926878
- [F6] Add preview assets — https://support.google.com/googleplay/android-developer/answer/9866151
- [F7] Data safety section — https://support.google.com/googleplay/android-developer/answer/10787469
- [F8] Health Content and Services — https://support.google.com/googleplay/android-developer/answer/16679511
- [F9] Permissions and APIs that access sensitive information (Exact alarm) — https://support.google.com/googleplay/android-developer/answer/16558241
- [F10] Foreground service and full-screen intent requirements — https://support.google.com/googleplay/android-developer/answer/13392821
- [F11] Android developer verification — https://developer.android.com/developer-verification/guides
- [F12] Foreground service types (systemExempted) — https://developer.android.com/develop/background-work/services/fgs/service-types
- [F13] Schedule exact alarms are denied by default (Android 14) — https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
