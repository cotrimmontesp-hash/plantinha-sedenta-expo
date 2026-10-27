package br.com.minanoideias.alarme;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

/** Guarda no celular (SharedPreferences) o despertador, os eventos ainda não lidos pelo app e se está tocando. */
final class Armazem {
  static final Object TRAVA = new Object();
  private static final String ARQ = "plantinha_alarme";
  static final int PARADO = 0, TOCANDO = 1, TOCANDO_TESTE = 2;

  private Armazem() {}

  private static SharedPreferences p(Context c) { return c.getApplicationContext().getSharedPreferences(ARQ, Context.MODE_PRIVATE); }

  static Regra.Desp desp(Context c) {
    SharedPreferences s = p(c);
    Regra.Desp d = new Regra.Desp();
    d.ligado = s.getBoolean("ligado", false);
    d.intervalo = s.getInt("intervalo", 90);
    d.inicio = s.getString("inicio", "08:00");
    d.fim = s.getString("fim", "20:00");
    d.ligadoEm = s.getLong("ligadoEm", 0);
    d.ultimoToque = s.getLong("ultimoToque", 0);
    d.soneca = s.getLong("soneca", 0);
    d.ultimoGole = s.getLong("ultimoGole", 0);
    return d;
  }

  static void salvar(Context c, Regra.Desp d) {
    p(c).edit().putBoolean("ligado", d.ligado).putInt("intervalo", d.intervalo).putString("inicio", d.inicio)
        .putString("fim", d.fim).putLong("ligadoEm", d.ligadoEm).putLong("ultimoToque", d.ultimoToque)
        .putLong("soneca", d.soneca).putLong("ultimoGole", d.ultimoGole).putBoolean("configurado", true).commit();
  }

  static boolean configurado(Context c) { return p(c).getBoolean("configurado", false); }

  static int tocando(Context c) { return p(c).getInt("tocando", PARADO); }
  static void tocando(Context c, int v) { p(c).edit().putInt("tocando", v).putLong("tocandoDesde", v == PARADO ? 0 : System.currentTimeMillis()).commit(); }

  static JSONArray eventos(Context c) {
    try { return new JSONArray(p(c).getString("eventos", "[]")); } catch (Exception e) { return new JSONArray(); }
  }

  static void evento(Context c, String tipo, long t) {
    JSONArray a = eventos(c);
    try { a.put(new JSONObject().put("tipo", tipo).put("t", t)); } catch (Exception ignorado) { return; }
    while (a.length() > 200) a.remove(0); // teto de segurança
    p(c).edit().putString("eventos", a.toString()).commit();
  }

  /** Apaga os eventos que o app já gravou (horário <= ate). */
  static void apagarEventos(Context c, long ate) {
    JSONArray a = eventos(c), r = new JSONArray();
    for (int i = 0; i < a.length(); i++) {
      JSONObject o = a.optJSONObject(i);
      if (o != null && o.optLong("t", 0) > ate) r.put(o);
    }
    p(c).edit().putString("eventos", r.toString()).commit();
  }

  static long proximo(Context c) { return p(c).getLong("proximo", -1); }
  static void proximo(Context c, long t) { p(c).edit().putLong("proximo", t).commit(); }
  static long teste(Context c) { return p(c).getLong("teste", -1); }
  static void teste(Context c, long t) { p(c).edit().putLong("teste", t).commit(); }
}
