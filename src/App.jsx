import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import api from './api'
import Header from './components/Header'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import CreatePost from './pages/CreatePost'
import ProfilePage from './pages/ProfilePage'
import { PollProvider } from './context/PollContext'
import PublicProfilePage from './pages/PublicProfilePage'
import { PostProvider } from './context/PostContext'
import Loading from './components/Loading';


function App() {
  const { isAuthenticated, user, isLoading } = useAuth0()
  const [localUser, setLocalUser] = useState(() => {
    const stored = localStorage.getItem('localUser')
    return stored ? JSON.parse(stored) : null
  })

  const [userSyncLoading, setUserSyncLoading] = useState(true) // 👈 Guard loading

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoading) {
        if (isAuthenticated && user) {
          await checkOrAddUser(user)
        } else {
          setLocalUser(null)
          localStorage.removeItem('localUser')
        }
        setUserSyncLoading(false) // 👈 Set loading false after API
      }
    }

    syncUser()
  }, [isLoading, isAuthenticated, user])


  async function checkOrAddUser(auth0User) {
    try {
      const payload = {
        auth0_id: auth0User.sub,
        name: auth0User.name,
        email: auth0User.email,
        profile_image: auth0User.picture
      };
  
      // ① single round‑trip, always safe:
      const { data } = await api.post('/users/add', payload);
      setLocalUser(data);
      localStorage.setItem('localUser', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to upsert user:', err);
    }
  }

  const authReady = !isLoading && !userSyncLoading && (localUser || !isAuthenticated)

  if (!authReady) return <Loading/>;

  return (
    <PostProvider localUser={localUser}>
      <PollProvider localUser={localUser}>
        <BrowserRouter>
          <Header localUser={localUser} />
          <NavBar localUser={localUser} />
          <Routes>
            <Route path="/" element={<HomePage localUser={localUser} />} />
            <Route path="/create-post" element={<CreatePost localUser={localUser} />} />
            <Route path="/profile" element={<ProfilePage localUser={localUser} authUser={user} />} />
            <Route path="/profile/:userId" element={<PublicProfilePage localUser={localUser} />} />
          </Routes>
        </BrowserRouter>
      </PollProvider>
    </PostProvider>
  )
}



export default App
