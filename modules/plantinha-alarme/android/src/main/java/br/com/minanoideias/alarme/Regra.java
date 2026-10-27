package br.com.minanoideias.alarme;

import java.util.Calendar;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cópia FIEL, em Java puro (sem Android), das regras do despertador de src/logica.ts:
 * naJanela, irParaJanela, proximoAlarme, marcarToque, soneca e beber (só a parte do despertador).
 * Horários sempre em America/Sao_Paulo. Testada contra o JavaScript por scripts/testar-regra-java.mjs.
 * Valor 0 = "nulo" (o JS usa `||`, então 0 e null dão o mesmo resultado).
 */
public final class Regra {
  public static final long MIN = 60000L;
  public static final long SONECA_MS = 10 * MIN;
  private static final TimeZone TZ = TimeZone.getTimeZone("America/Sao_Paulo");
  private static final Pattern HORA = Pattern.compile("^(\\d{1,2}):(\\d{2})");

  /** Estado do despertador que o alarme nativo precisa (igual ao objeto Despertador do JS + último copo). */
  public static final class Desp {
    public boolean ligado;
    public int intervalo = 90; // minutos
    public String inicio = "08:00";
    public String fim = "20:00";
    public long ligadoEm, ultimoToque, soneca, ultimoGole;
  }

  private Regra() {}

  static int minDe(long ms) {
    Calendar c = Calendar.getInstance(TZ);
    c.setTimeInMillis(ms);
    return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
  }

  static int minTxt(String t, int pad) {
    Matcher m = HORA.matcher(t == null ? "" : t);
    if (!m.find()) return pad;
    return Math.min(1439, Integer.parseInt(m.group(1)) * 60 + Integer.parseInt(m.group(2)));
  }

  public static boolean naJanela(Desp d, long ms) {
    int m = minDe(ms), a = minTxt(d.inicio, 480), b = minTxt(d.fim, 1200);
    return a <= b ? (m >= a && m <= b) : (m >= a || m <= b);
  }

  static long irParaJanela(Desp d, long ms) {
    if (naJanela(d, ms)) return ms;
    int falta = ((minTxt(d.inicio, 480) - minDe(ms)) % 1440 + 1440) % 1440;
    return ms - (ms % MIN) + falta * MIN;
  }

  /** Próximo toque (ms) ou -1 se desligado. */
  public static long proximo(Desp d, long agora) {
    if (!d.ligado) return -1;
    long alvo = d.soneca != 0 ? d.soneca
        : Math.max(Math.max(d.ultimoGole, d.ultimoToque), d.ligadoEm) + d.intervalo * MIN;
    if (alvo < agora && !naJanela(d, agora)) alvo = agora;
    return irParaJanela(d, alvo);
  }

  public static void marcarToque(Desp d, long agora) { d.ultimoToque = agora; d.soneca = 0; }

  public static long soneca(Desp d, long agora) { d.ultimoToque = agora; d.soneca = agora + SONECA_MS; return d.soneca; }

  /** Só o que o "Bebi um copo" muda no despertador: último copo e fim da soneca. */
  public static void beber(Desp d, long agora) { d.ultimoGole = agora; d.soneca = 0; }

  /** Aplica um evento ("toque", "bebi" ou "soneca"). */
  public static void aplicar(Desp d, String tipo, long t) {
    if ("toque".equals(tipo)) marcarToque(d, t);
    else if ("bebi".equals(tipo)) beber(d, t);
    else if ("soneca".equals(tipo)) soneca(d, t);
  }
}
