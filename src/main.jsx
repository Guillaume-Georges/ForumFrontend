// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/App.css'
import { Auth0Provider } from '@auth0/auth0-react'

const domain = 'dev-46ciiiyuw1kbqw6o.us.auth0.com'
const clientId = '2za7E88wa6PCQCo8POSjoCoP0KVM3q1x' // your real client ID

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      cacheLocation="localstorage" // ✅ add this
      useRefreshTokens={true}       // ✅ optional for long sessions
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
)
