import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToolsApp } from './tools/ToolsApp'
import './styles.css'

createRoot(document.getElementById('tools-root')!).render(
  <StrictMode>
    <ToolsApp />
  </StrictMode>
)
