package br.com.minanoideias.alarme;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.lang.ref.WeakReference;

/** Tela de alarme que abre por cima da tela bloqueada e acende a tela. Só 2 botões grandes. */
public class AlarmeActivity extends Activity {
  private static WeakReference<AlarmeActivity> aberta = new WeakReference<>(null);

  static void fechar() {
    AlarmeActivity a = aberta.get();
    if (a != null) a.runOnUiThread(a::finish);
  }

  @Override
  @SuppressWarnings("deprecation")
  protected void onCreate(Bundle b) {
    super.onCreate(b);
    if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true); }
    else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    aberta = new WeakReference<>(this);
    setContentView(montar());
  }

  @Override
  protected void onResume() {
    super.onResume();
    if (Armazem.tocando(this) == Armazem.PARADO) finish(); // já respondido pela notificação
  }

  @Override
  protected void onDestroy() {
    if (aberta.get() == this) aberta = new WeakReference<>(null);
    super.onDestroy();
  }

  private int dp(float v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()); }

  private Button botao(String txt, int fundo, int cor, float tam, View.OnClickListener ao) {
    Button bt = new Button(this);
    bt.setText(txt);
    bt.setAllCaps(false);
    bt.setTextColor(cor);
    bt.setTextSize(TypedValue.COMPLEX_UNIT_SP, tam);
    bt.setTypeface(Typeface.DEFAULT_BOLD);
    GradientDrawable g = new GradientDrawable();
    g.setColor(fundo);
    g.setCornerRadius(dp(18));
    g.setStroke(dp(2), Color.parseColor("#2d5671"));
    bt.setBackground(g);
    bt.setPadding(dp(12), dp(18), dp(12), dp(18));
    bt.setOnClickListener(ao);
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    lp.topMargin = dp(18);
    bt.setLayoutParams(lp);
    bt.setMinHeight(dp(88));
    return bt;
  }

  private TextView texto(String s, float tam, int cor, boolean negrito) {
    TextView t = new TextView(this);
    t.setText(s);
    t.setTextSize(TypedValue.COMPLEX_UNIT_SP, tam);
    t.setTextColor(cor);
    t.setGravity(Gravity.CENTER);
    if (negrito) t.setTypeface(Typeface.DEFAULT_BOLD);
    t.setPadding(0, dp(8), 0, dp(8));
    return t;
  }

  private View montar() {
    LinearLayout l = new LinearLayout(this);
    l.setOrientation(LinearLayout.VERTICAL);
    l.setGravity(Gravity.CENTER);
    l.setBackgroundColor(Color.parseColor("#0b1d2a"));
    l.setPadding(dp(28), dp(40), dp(28), dp(40));
    boolean teste = Armazem.tocando(this) == Armazem.TOCANDO_TESTE;
    l.addView(texto("🌱💧", 64, Color.WHITE, false));
    l.addView(texto(teste ? "🧪 Teste do alarme" : "Hora de beber água!", 32, Color.WHITE, true));
    l.addView(texto("A plantinha está com sede.", 20, Color.parseColor("#d6e6f2"), false));
    l.addView(botao("Já bebi 💧", Color.parseColor("#ffd23f"), Color.parseColor("#111111"), 28, v -> {
      Agendador.responder(this, true);
      Toast.makeText(getApplicationContext(), "💧 Copo registrado! A plantinha agradece.", Toast.LENGTH_LONG).show();
      finish();
    }));
    l.addView(botao("😴 Daqui a pouco (10 min)", Color.parseColor("#12293a"), Color.WHITE, 22, v -> {
      Agendador.responder(this, false);
      Toast.makeText(getApplicationContext(), "😴 Toco de novo em 10 minutos.", Toast.LENGTH_LONG).show();
      finish();
    }));
    return l;
  }

  @Override
  @SuppressWarnings("deprecation")
  public void onBackPressed() {
    moveTaskToBack(true); // sai da tela, mas continua tocando até responder (botões também na notificação)
  }
}
