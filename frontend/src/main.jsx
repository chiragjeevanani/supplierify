import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyCachedTheme, applyCachedFontScale } from './utils/theme'

// Paint with the last saved colours and text size straight away (the server's settings re-apply them once loaded)
applyCachedTheme()
applyCachedFontScale()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
