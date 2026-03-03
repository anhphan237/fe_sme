import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

async function clearMockServiceWorker() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((r) => r.unregister()))
  }
}

clearMockServiceWorker().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root')!)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
