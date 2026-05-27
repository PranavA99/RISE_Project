import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import WebBotApp from './ImprovedApp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WebBotApp />
  </StrictMode>,
);