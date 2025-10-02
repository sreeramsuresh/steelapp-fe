import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Dev-only Tailwind fallback: load CDN if utilities aren't present yet
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const ensureTailwind = () => {
    // Create a test element to detect if Tailwind utilities are active
    const test = document.createElement('div');
    test.className = 'hidden h-4 w-4 bg-teal-500';
    document.body.appendChild(test);
    const styles = window.getComputedStyle(test);
    const hasBg = styles.backgroundColor !== '' && styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    document.body.removeChild(test);
    return hasBg;
  };

  if (!ensureTailwind()) {
    const existing = document.querySelector('script[src*="cdn.tailwindcss.com"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(s);
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
