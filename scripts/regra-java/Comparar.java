import br.com.minanoideias.alarme.Regra;
import java.io.BufferedReader;
import java.io.InputStreamReader;

/** Lê casos (uma linha por caso, campos separados por ';') e imprime o que o Java calcula. Usado por testar-regra-java.mjs. */
public class Comparar {
  public static void main(String[] a) throws Exception {
    BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "UTF-8"));
    StringBuilder out = new StringBuilder();
    String linha;
    while ((linha = in.readLine()) != null) {
      String[] c = linha.split(";", -1);
      Regra.Desp d = new Regra.Desp();
      d.ligado = c[0].equals("1"); d.intervalo = Integer.parseInt(c[1]); d.inicio = c[2]; d.fim = c[3];
      d.ligadoEm = Long.parseLong(c[4]); d.ultimoToque = Long.parseLong(c[5]); d.soneca = Long.parseLong(c[6]); d.ultimoGole = Long.parseLong(c[7]);
      long agora = Long.parseLong(c[8]);
      // 1) próximo alarme; 2) cadeia de 7 dias como o alarme nativo faz (toca, marca o toque, agenda o próximo)
      StringBuilder s = new StringBuilder();
      s.append(Regra.proximo(d, agora)).append('|').append(Regra.naJanela(d, agora) ? 1 : 0).append('|');
      long limite = agora + 7 * 86400000L, cur = agora;
      int n = 0;
      for (int i = 0; i < 2000 && n < 60; i++) {
        long t = Regra.proximo(d, cur);
        if (t < 0) break;
        if (t < cur) t = cur;
        if (t > limite) break;
        if (t > agora + 5000) { s.append(t).append(','); n++; }
        Regra.marcarToque(d, t);
        cur = t;
      }
      out.append(s).append('\n');
    }
    System.out.print(out);
  }
}
