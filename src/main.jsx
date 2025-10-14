import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Home from './pages'
// import App from './App.jsx'
// import { Home } from './Home.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Home />
  </StrictMode>,
)
