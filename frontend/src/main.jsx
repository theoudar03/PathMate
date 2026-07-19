import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

// Intercept relative fetch calls to point to the Vercel backend
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && (resource.startsWith('/api') || resource.startsWith('/auth'))) {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://path-mate-six.vercel.app';
    resource = baseUrl + resource;
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

