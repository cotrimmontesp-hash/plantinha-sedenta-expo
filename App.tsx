// Plantinha Sedenta — versão Expo. As 4 abas (Hoje, Histórico, Conquistas, Ajustes) ficam em src/navegacao/.
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { cor } from './src/tema';
import Navegacao from './src/navegacao/Navegacao';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <SafeAreaProvider>
      {/* embaixo, a própria barra de abas desvia da barra de navegação do Android */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: cor.fundo }}>
        <StatusBar style="light" />
        <Navegacao />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
