// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import api from './api'
import Header from './components/Header'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import CreatePost from './pages/CreatePost'
import ProfilePage from './pages/ProfilePage';
import { PollProvider } from './context/PollContext';
import PublicProfilePage from './pages/PublicProfilePage';


function App() {
  const { isAuthenticated, user, isLoading } = useAuth0() // added isLoading
  const [localUser, setLocalUser] = useState(() => {
    const stored = localStorage.getItem('localUser')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        checkOrAddUser(user)
      } else {
        // ✅ Clear the cached localUser if auth0 says not authenticated
        setLocalUser(null)
        localStorage.removeItem('localUser')
      }
    }
  }, [isLoading, isAuthenticated, user])

  async function checkOrAddUser(auth0User) {
    try {
      const payload = {
        auth0_id: auth0User.sub,
        name: auth0User.name,
        email: auth0User.email,
        profile_image: auth0User.picture
      }
      const res = await api.post('/users/add', payload)
      setLocalUser(res.data)
      localStorage.setItem('localUser', JSON.stringify(res.data))
    } catch (err) {
      console.error('Failed to check/add user:', err)
    }
  }

  // ✅ Only render once everything is ready
  const authReady = !isLoading && (localUser || !isAuthenticated)
  if (!authReady) return <div>Loading...</div>

  

  return (
    <PollProvider localUser={localUser}>
    <BrowserRouter>
      <Header localUser={localUser} />
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage localUser={localUser} />} />
        <Route path="/create-post" element={<CreatePost localUser={localUser} />} />
        <Route path="/profile" element={<ProfilePage localUser={localUser} authUser={user} />} />
        <Route path="/profile/:userId" element={<PublicProfilePage localUser={localUser} />} /> 
      </Routes>
    </BrowserRouter>
    </PollProvider>
  )
}

export default App
