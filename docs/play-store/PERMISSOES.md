# Permissões Android — revisão para a Play

> Só documentação. **Nenhuma permissão foi mudada** nesta versão (o comportamento do alarme ficou igual).
> Lista conferida no manifesto final do APK 1.1.0 (`aapt2 dump`) e em `modules/plantinha-alarme/android/src/main/AndroidManifest.xml`.

## Lista completa e de onde vem

| Permissão | Quem pede | Para quê no app |
|---|---|---|
| `POST_NOTIFICATIONS` | app.json + módulo | Mostrar o lembrete e a notificação do alarme (Android 13+ pergunta ao usuário) |
| `SCHEDULE_EXACT_ALARM` | app.json + módulo | Agendar o lembrete na hora exata (`AlarmManager.setAlarmClock`) |
| `USE_EXACT_ALARM` | app.json + módulo | O mesmo, concedida automaticamente — **restrita pela Play** (ver abaixo) |
| `USE_FULL_SCREEN_INTENT` | app.json + módulo | Abrir a tela do alarme por cima da tela bloqueada |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | app.json + módulo | Serviço `AlarmeServico` que toca o som em loop até a resposta |
| `WAKE_LOCK` | app.json + módulo | Manter a CPU acordada enquanto o alarme toca |
| `VIBRATE` | app.json + módulo | Vibrar junto com o alarme |
| `RECEIVE_BOOT_COMPLETED` | app.json + módulo | Reagendar o próximo lembrete depois de reiniciar o celular |
| `MODIFY_AUDIO_SETTINGS` | biblioteca `expo-audio` | Pedida pela biblioteca de som (o app não muda volume do sistema) |
| `INTERNET` | padrão do React Native | **O código do app não faz nenhuma chamada de rede** (conferido; ver POLITICA_PRIVACIDADE.md) |

Bloqueadas de propósito (`blockedPermissions`): `RECORD_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`.

## 1. Alarme exato — `USE_EXACT_ALARM` ⚠️ risco ALTO
**Regra:** a Play só permite `USE_EXACT_ALARM` para apps cuja função principal é **despertador/timer** ou **calendário** com avisos de eventos; os demais devem usar `SCHEDULE_EXACT_ALARM` (o usuário concede em "Alarmes e lembretes") [F9][F13].

**Justificativa honesta (se o Paulo quiser tentar):**
> "A Plantinha Sedenta é um despertador de beber água: o usuário escolhe dias e horários e o app toca um alarme em loop, que abre sobre a tela bloqueada, até a pessoa responder 'Já bebi' ou 'Daqui a pouco'. Sem alarme exato o lembrete pode atrasar vários minutos e perde a função."

**Risco real:** um app de hidratação provavelmente **não** será visto como "despertador" pela Play — chance alta de recusa ou pedido para remover.

**Alternativa recomendada (não implementada):** tirar `USE_EXACT_ALARM` e ficar só com `SCHEDULE_EXACT_ALARM`.
- No Android 14+ ela vem **negada** em instalações novas [F13]; o usuário precisa liberar em Configurações > Apps > Acesso especial > Alarmes e lembretes.
- O app **já** trata isso: `Agendador.java` confere `canScheduleExactAlarms()` e, sem a permissão, usa `setAndAllowWhileIdle` (pode atrasar); a tela mostra o botão "⚠️ Permitir alarmes na hora certa"; `ReceptorBoot` reagenda quando a permissão muda.
- Mudança necessária: remover a linha de `app.json` **e** do manifesto do módulo (precisa mexer no nativo → outra tarefa, com teste no A23).

## 2. Tela cheia — `USE_FULL_SCREEN_INTENT` ⚠️ risco MÉDIO
**Regra:** desde 22/01/2025, para apps com alvo Android 14+, a permissão só vem ligada automaticamente para apps de **chamadas** ou **despertador**; os outros podem usar, mas o usuário precisa conceder, e o app deve funcionar de forma reduzida se negar. Declaração obrigatória em Conteúdo do app [F10].

**Justificativa honesta:**
> "Quando chega a hora de beber água, a notificação abre a tela do alarme por cima da tela bloqueada com os botões 'Já bebi' e 'Daqui a pouco'. Se a permissão for negada, o app mostra só a notificação (que toca e tem os mesmos botões)."

**Na declaração:** o mais honesto é responder que a função principal **não** é despertador/chamada (é lembrete de hidratação). Assim a permissão não vem automática e o usuário concede. O app **já** pede isso: `PlantinhaAlarmeModule.kt` usa `canUseFullScreenIntent()` e a tela mostra "⚠️ Permitir alarme em tela cheia". Se o Paulo declarar como despertador, a Play pode discordar (mesmo argumento do item 1).

## 3. Serviço em primeiro plano tipo `mediaPlayback` ⚠️ risco ALTO
**Regra:** declaração de serviço em primeiro plano na Console, para cada tipo: descrição, impacto se adiado/interrompido e **link de vídeo** mostrando o recurso [F10]. Para `mediaPlayback` a Play diz que a reprodução tem que ser **iniciada pelo usuário**; trilha automática **não** conta [F10].

**Problema:** o som do alarme começa sozinho (pelo AlarmManager), não por um toque do usuário → não combina com o uso "Media Playback" da tabela da Play.

**Justificativa honesta (se mantiver):**
> "AlarmeServico toca o som do lembrete em loop (áudio com uso ALARM) desde a hora agendada até o usuário tocar 'Já bebi' ou 'Daqui a pouco'. Se o sistema adiar, o lembrete toca atrasado; se interromper, o som para antes da resposta e o lembrete se perde."

**Alternativa (não implementada):** tipo **`systemExempted`** + permissão `FOREGROUND_SERVICE_SYSTEM_EXEMPTED`. A documentação do Android permite esse tipo para apps que têm `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` e usam o serviço para **continuar alarmes** [F12]. Exige mudar o manifesto do módulo e `AlarmeServico.java` (`FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED`) — mexe no nativo e precisa de teste no A23. Outra opção é `specialUse` (também revisada pela Play) [F10].
Observação técnica: iniciar o serviço em segundo plano é permitido quando um alarme exato dispara (exceção documentada pelo Android).

## 4. As demais
- `POST_NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `MODIFY_AUDIO_SETTINGS`, `INTERNET`: permissões comuns, sem declaração especial.
- `INTERNET` poderia ser bloqueada em `blockedPermissions` (o app não usa rede), mas o React Native usa a rede no modo de desenvolvimento; testar antes. Não mudei.

## Resumo para decidir
| Opção | Esforço | Risco Play | Efeito para o usuário |
|---|---|---|---|
| Manter tudo como está | zero | alto (itens 1 e 3) | igual hoje |
| Só `SCHEDULE_EXACT_ALARM` + `systemExempted` + tela cheia concedida pelo usuário | mudança nativa pequena + teste no A23 | menor | na 1ª vez, liberar "Alarmes e lembretes" e "tela cheia" (o app já mostra os botões ⚠️) |

Fontes: ver [README.md](README.md#fontes-lidas-em-27102026) (F9, F10, F12, F13).
