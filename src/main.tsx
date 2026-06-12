// src/main.tsx — application entry point. Mounts <App /> into the DOM and
// arms the sync triggers (no-ops until the user enables sync).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSyncTriggers } from './lib/syncEngine'

void initSyncTriggers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
