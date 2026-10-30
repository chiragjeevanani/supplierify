import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyCachedTheme } from './utils/theme'

// Paint with the last saved colour theme straight away (the server's settings re-apply it once loaded)
applyCachedTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
