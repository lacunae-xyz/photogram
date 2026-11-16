import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './styles.css';
import App from './App';
import { beforeSend } from './track';
import * as serviceWorker from './customServiceWorker';

window.umamiBeforeSend = beforeSend;

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.register();
