import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Google sign-in is intentionally not wired up: it needs a real Google OAuth client ID plus a backend endpoint that
// verifies the Google token. See DEPLOYMENT.md ("Google sign-in") for the steps.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
