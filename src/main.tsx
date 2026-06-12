// src/main.tsx — application entry point. Mounts <App /> into the DOM.
// Nothing else belongs here: no state, no logic, no routing.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
