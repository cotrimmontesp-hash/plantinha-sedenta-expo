import { registerRootComponent } from 'expo';
import App from './App';
import { registrarServiceWorker } from './src/lembretes/notificacoes';

registrarServiceWorker(); // só na web (offline + avisos no Chrome do Android)
registerRootComponent(App);
