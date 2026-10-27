package br.com.minanoideias.alarme;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

/** Canais e notificação do alarme (alta prioridade, categoria alarme, tela cheia, 2 botões). */
final class Avisos {
  static final int ID = 4242, ID_RESERVA = 4243;
  static final String CANAL = "alarme-agua"; // o som vem do serviço (MediaPlayer em loop)
  static final String CANAL_RESERVA = "alarme-agua-som"; // se o serviço não puder começar: a própria notificação repete o som
  static final String TITULO = "💧 Hora de beber água!";

  private Avisos() {}

  static AudioAttributes audioAlarme() {
    return new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
  }

  static Uri som(Context c) {
    int id = c.getResources().getIdentifier("alarme", "raw", c.getPackageName());
    if (id != 0) return Uri.parse("android.resource://" + c.getPackageName() + "/" + id);
    return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
  }

  static void canais(Context c) {
    if (Build.VERSION.SDK_INT < 26) return;
    NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null) return;
    NotificationChannel a = new NotificationChannel(CANAL, "Alarme de beber água", NotificationManager.IMPORTANCE_HIGH);
    a.setDescription("Toca até você responder \"Já bebi\" ou \"Daqui a pouco\", mesmo com a tela bloqueada.");
    a.setSound(null, null);
    a.enableVibration(false);
    a.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
    a.setBypassDnd(true);
    a.setShowBadge(false);
    nm.createNotificationChannel(a);
    NotificationChannel b = new NotificationChannel(CANAL_RESERVA, "Alarme de beber água (reserva)", NotificationManager.IMPORTANCE_HIGH);
    b.setDescription("Usado só se o alarme principal não conseguir tocar.");
    b.setSound(som(c), audioAlarme());
    b.enableVibration(true);
    b.setVibrationPattern(new long[] {0, 600, 400, 600, 400, 1000});
    b.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
    b.setBypassDnd(true);
    b.setShowBadge(false);
    nm.createNotificationChannel(b);
  }

  private static int icone(Context c) {
    int id = c.getResources().getIdentifier("notification_icon", "drawable", c.getPackageName());
    return id != 0 ? id : android.R.drawable.ic_lock_idle_alarm;
  }

  static PendingIntent piTela(Context c) {
    Intent i = new Intent(c, AlarmeActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
    return PendingIntent.getActivity(c, 1, i, Agendador.flags());
  }

  @SuppressWarnings("deprecation")
  static Notification criar(Context c, boolean teste, boolean reserva) {
    canais(c);
    Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, reserva ? CANAL_RESERVA : CANAL) : new Notification.Builder(c);
    PendingIntent tela = piTela(c);
    int ic = icone(c);
    b.setSmallIcon(ic)
        .setContentTitle(teste ? "🧪 Teste: " + TITULO : TITULO)
        .setContentText("A plantinha está com sede 🌱 Toque em Já bebi ou Daqui a pouco.")
        .setCategory(Notification.CATEGORY_ALARM)
        .setPriority(Notification.PRIORITY_MAX)
        .setVisibility(Notification.VISIBILITY_PUBLIC)
        .setOngoing(true)
        .setAutoCancel(false)
        .setShowWhen(true)
        .setColor(0xFF4FC3FF)
        .setContentIntent(tela)
        .setFullScreenIntent(tela, true)
        .setDeleteIntent(Agendador.piReceptor(c, Agendador.REPOR, 5))
        .addAction(new Notification.Action.Builder(Icon.createWithResource(c, ic), "Já bebi 💧", Agendador.piReceptor(c, Agendador.BEBI, 2)).build())
        .addAction(new Notification.Action.Builder(Icon.createWithResource(c, ic), "Daqui a pouco (10 min)", Agendador.piReceptor(c, Agendador.SONECA, 3)).build());
    if (reserva && Build.VERSION.SDK_INT < 26) {
      b.setSound(som(c), audioAlarme());
      b.setVibrate(new long[] {0, 600, 400, 600, 400, 1000});
    }
    if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
    Notification n = b.build();
    n.flags |= Notification.FLAG_NO_CLEAR | Notification.FLAG_ONGOING_EVENT;
    if (reserva) n.flags |= Notification.FLAG_INSISTENT; // repete o som até tocar num botão
    return n;
  }

  /** Reserva: notificação insistente (o som do canal repete) quando o serviço não pôde começar. */
  static void reserva(Context c, boolean teste) {
    NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null) return;
    try { nm.notify(ID_RESERVA, criar(c, teste, true)); } catch (Exception ignorado) { /* sem permissão de notificação */ }
  }
}
