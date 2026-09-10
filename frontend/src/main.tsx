import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

window.onerror = function (msg, _url, _line, _col, error) {
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: monospace; background: white; z-index: 9999; position: fixed; top: 0; left: 0; width: 100%; height: 100%;">
      <h2>Fatal React Error</h2>
      <p><strong>Message:</strong> ${msg}</p>
      <pre>${error?.stack || ''}</pre>
    </div>
  `;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
