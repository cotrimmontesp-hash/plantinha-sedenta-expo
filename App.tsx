// Plantinha Sedenta — versão Expo (paridade com o PWA v5). A tela fica em src/telas/Jogo.tsx.
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { cor } from './src/tema';
import Jogo from './src/telas/Jogo';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: cor.fundo }}>
        <StatusBar style="light" />
        <Jogo />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
