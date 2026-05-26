import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import WebBotApp from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WebBotApp />
  </StrictMode>,
);