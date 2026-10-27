package br.com.minanoideias.alarme;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Agenda UM alarme exato por vez (AlarmManager.setAlarmClock) para o próximo lembrete, calculado com a
 * mesma regra do app (Regra.java). Quando toca, marca o toque e já agenda o seguinte: assim a agenda
 * continua sozinha por dias, com o app fechado. Depois de reiniciar o celular, ReceptorBoot agenda de novo.
 */
final class Agendador {
  static final String DISPARAR = "br.com.minanoideias.alarme.DISPARAR";
  static final String TESTE = "br.com.minanoideias.alarme.TESTE";
  static final String BEBI = "br.com.minanoideias.alarme.BEBI";
  static final String SONECA = "br.com.minanoideias.alarme.SONECA";
  static final String REPOR = "br.com.minanoideias.alarme.REPOR";
  private static final int RC_ALARME = 10, RC_TESTE = 11;

  private Agendador() {}

  static int flags() { return PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0); }

  static PendingIntent piReceptor(Context c, String acao, int rc) {
    Intent i = new Intent(c, Receptor.class).setAction(acao).setPackage(c.getPackageName());
    return PendingIntent.getBroadcast(c, rc, i, flags());
  }

  private static void marcar(Context c, long quando, PendingIntent pi) {
    AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
    if (am == null) return;
    boolean exato = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
    try {
      if (exato) {
        Intent abrir = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        PendingIntent mostrar = abrir == null ? null : PendingIntent.getActivity(c, 12, abrir, flags());
        am.setAlarmClock(new AlarmManager.AlarmClockInfo(quando, mostrar), pi);
      } else if (Build.VERSION.SDK_INT >= 23) {
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, quando, pi); // sem "Alarmes e lembretes": pode atrasar
      } else {
        am.set(AlarmManager.RTC_WAKEUP, quando, pi);
      }
    } catch (SecurityException e) {
      am.set(AlarmManager.RTC_WAKEUP, quando, pi);
    }
  }

  /** Recalcula e agenda o próximo lembrete. Devolve o horário (ms) ou -1 se desligado. */
  static long agendar(Context c) {
    synchronized (Armazem.TRAVA) {
      AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
      PendingIntent pi = piReceptor(c, DISPARAR, RC_ALARME);
      long agora = System.currentTimeMillis();
      long p = Regra.proximo(Armazem.desp(c), agora);
      if (p < 0) {
        if (am != null) am.cancel(pi);
        Armazem.proximo(c, -1);
        return -1;
      }
      long quando = Math.max(p, agora + 1500); // atrasado (ex.: celular estava desligado): toca já, como o app aberto
      marcar(c, quando, pi);
      Armazem.proximo(c, p);
      long t = Armazem.teste(c);
      if (t > agora) marcar(c, t, piReceptor(c, TESTE, RC_TESTE)); // reboot no meio de um teste
      return p;
    }
  }

  /** Configuração vinda do app (JSON do despertador + ultimoGole). Eventos ainda não lidos pelo app são reaplicados por cima. */
  static long configurar(Context c, String json) {
    synchronized (Armazem.TRAVA) {
      try {
        JSONObject o = new JSONObject(json);
        Regra.Desp d = new Regra.Desp();
        d.ligado = o.optBoolean("ligado", false);
        d.intervalo = o.optInt("intervalo", 90);
        d.inicio = o.optString("inicio", "08:00");
        d.fim = o.optString("fim", "20:00");
        d.ligadoEm = o.optLong("ligadoEm", 0);
        d.ultimoToque = o.optLong("ultimoToque", 0);
        d.soneca = o.optLong("soneca", 0);
        d.ultimoGole = o.optLong("ultimoGole", 0);
        JSONArray ev = Armazem.eventos(c);
        for (int i = 0; i < ev.length(); i++) {
          JSONObject e = ev.optJSONObject(i);
          if (e != null) Regra.aplicar(d, e.optString("tipo"), e.optLong("t", 0));
        }
        Armazem.salvar(c, d);
      } catch (Exception ignorado) { /* JSON ruim: mantém o que tinha */ }
      return agendar(c);
    }
  }

  /** Alarme de teste daqui a pouco (não mexe no despertador). */
  static long testar(Context c, long quando) {
    synchronized (Armazem.TRAVA) {
      Armazem.teste(c, quando);
      marcar(c, quando, piReceptor(c, TESTE, RC_TESTE));
      return quando;
    }
  }

  /** O AlarmManager chamou. */
  static void disparou(Context c, boolean teste) {
    synchronized (Armazem.TRAVA) {
      long agora = System.currentTimeMillis();
      if (teste) {
        Armazem.teste(c, -1);
      } else {
        Regra.Desp d = Armazem.desp(c);
        long p = Regra.proximo(d, agora);
        // fora de hora (config mudou e o alarme velho ficou) => só reagenda, não toca
        if (p < 0 || p > agora + 60000 || !Regra.naJanela(d, Math.max(agora, p))) { agendar(c); return; }
        Regra.marcarToque(d, agora);
        Armazem.salvar(c, d);
        Armazem.evento(c, "toque", agora);
        agendar(c); // o próximo já fica agendado antes de começar a tocar
      }
      if (Armazem.tocando(c) == Armazem.PARADO || !teste) Armazem.tocando(c, teste ? Armazem.TOCANDO_TESTE : Armazem.TOCANDO);
    }
    AlarmeServico.iniciar(c);
  }

  /** "Já bebi" ou "Daqui a pouco" (da notificação ou da tela de alarme). */
  static void responder(Context c, boolean bebi) {
    int estava;
    synchronized (Armazem.TRAVA) {
      estava = Armazem.tocando(c);
      Armazem.tocando(c, Armazem.PARADO);
    }
    AlarmeServico.parar(c);
    AlarmeActivity.fechar();
    if (estava == Armazem.PARADO) return; // toque repetido / notificação velha: não conta 2 vezes
    synchronized (Armazem.TRAVA) {
      long agora = System.currentTimeMillis();
      Regra.Desp d = Armazem.desp(c);
      if (bebi) {
        Regra.beber(d, agora);
        Armazem.salvar(c, d);
        Armazem.evento(c, "bebi", agora);
      } else if (estava == Armazem.TOCANDO_TESTE) {
        testar(c, agora + Regra.SONECA_MS); // teste: toca de novo em 10 min, sem mexer no despertador
      } else {
        Regra.soneca(d, agora);
        Armazem.salvar(c, d);
        Armazem.evento(c, "soneca", agora);
      }
      agendar(c);
    }
  }

  static void limparNotificacoes(Context c) {
    NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm != null) { nm.cancel(Avisos.ID); nm.cancel(Avisos.ID_RESERVA); }
  }
}
