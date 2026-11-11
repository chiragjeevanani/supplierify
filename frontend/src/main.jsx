import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyCachedTheme, applyCachedFontScale } from './utils/theme'

// Paint with the last saved colours and text size straight away (the server's settings re-apply them once loaded)
applyCachedTheme()
applyCachedFontScale()

// An uploaded image that can no longer be loaded (deleted / lost on the server) shows a neutral
// placeholder instead of the browser's broken-image icon. Components that handle this themselves
// (logo, banner slider) mark their <img> with data-no-fallback.
const IMAGE_PLACEHOLDER = '/assets/dryfruits/placeholder.svg'
document.addEventListener(
  'error',
  (e) => {
    const img = e.target
    if (!(img instanceof HTMLImageElement) || img.hasAttribute('data-no-fallback')) return
    if (!/\/uploads\//.test(img.currentSrc || img.src) || img.dataset.fallbackApplied) return
    img.dataset.fallbackApplied = '1'
    img.src = IMAGE_PLACEHOLDER
  },
  true
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
