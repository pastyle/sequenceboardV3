console.log("BOOT", {
  hasKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  keyLen: import.meta.env.VITE_FIREBASE_API_KEY?.length,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
