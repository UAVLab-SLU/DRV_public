import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ColorModeProvider from './theme/ColorModeProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ColorModeProvider>
    <App />
  </ColorModeProvider>,
);
