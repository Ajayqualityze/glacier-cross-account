import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App';
import './index.css';

// Load Amplify config (generated after deployment)
try {
  // @ts-ignore - File generated at build time by Amplify
  const outputs = await import('../amplify_outputs.json');
  Amplify.configure(outputs.default || outputs);
} catch (e) {
  console.warn('Amplify outputs not found. Run "npx ampx sandbox" first.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
