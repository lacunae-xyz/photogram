import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles.css';
import App from './App';
import { beforeSend } from './track';
import * as serviceWorker from './customServiceWorker';

window.umamiBeforeSend = beforeSend;

createRoot(document.getElementById('root')).render(<App />);

serviceWorker.register();
