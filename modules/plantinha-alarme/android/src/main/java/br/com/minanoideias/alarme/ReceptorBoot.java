package br.com.minanoideias.alarme;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Depois de reiniciar o celular, atualizar o app ou mudar a hora: agenda o próximo lembrete de novo. */
public class ReceptorBoot extends BroadcastReceiver {
  @Override
  public void onReceive(Context c, Intent i) {
    if (!Armazem.configurado(c)) return; // app ainda não foi aberto depois de instalar
    Agendador.agendar(c);
    if (Armazem.tocando(c) != Armazem.PARADO) AlarmeServico.iniciar(c); // estava tocando sem resposta quando desligou
  }
}
