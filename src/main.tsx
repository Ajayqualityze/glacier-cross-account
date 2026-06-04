import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App';
import './index.css';

// Load Amplify config (generated after deployment)
fetch('/amplify_outputs.json')
  .then((res) => res.json())
  .then((config) => {
    Amplify.configure(config);
  })
  .catch(() => {
    console.warn('Amplify outputs not found. Backend may not be deployed yet.');
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);

