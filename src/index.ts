import './index.css';
import './styles.css';
import './App/photogram-app';
import { beforeSend } from './track';
import * as serviceWorker from './customServiceWorker';

declare global {
  interface Window {
    umamiBeforeSend: typeof beforeSend;
  }
}

window.umamiBeforeSend = beforeSend;

function mount() {
  document.body.append(document.createElement('photogram-app'));
}

// The router matches with URLPattern: Safari before 26 and Firefox before 142 don't have it.
if ('URLPattern' in globalThis) {
  mount();
} else {
  import('urlpattern-polyfill').then(mount);
}

serviceWorker.register();
