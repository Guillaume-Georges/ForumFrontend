// frontend\src\components\Header.jsx

import React, { useState, useRef, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import Logo from '../assets/ScholarTalks.png'
import PersonImage from '../assets/PersonIcon.png'


function Header({ localUser }) {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef()
 

  const { user } = useAuth0()
  const profileImage = localUser?.profile_image || user?.picture || PersonImage


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading) {
    return null // or a loading skeleton if you want
  }
  


  return (
    <header className="header">
      <div
        className="header-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')} // ⬅️ Clicking logo navigates home
      >
        <img src={Logo} alt="AI Education Forum" />
      </div>

      <div className="header-search">
        <input type="text" placeholder="Search a discussion" />
      </div>

      <div className="header-profile" ref={dropdownRef}>
      {!isAuthenticated ? (
  <button onClick={() => loginWithRedirect()}>
    Login / Sign Up
  </button>
) : localUser && (
  <div style={{ position: 'relative' }}>
    <div
      onClick={() => setShowDropdown(prev => !prev)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer'
      }}
    >
      
      <img
        src={profileImage}
        alt="profile"
        style={{ width: 40, height: 40, borderRadius: '50%' }}
        onError={(e) => { e.target.onerror = null; e.target.src = PersonImage }}
      />
      <div>
        <strong>{localUser?.name}</strong>
      </div>
    </div>

    {showDropdown && (
      <div style={{
        position: 'absolute',
        right: 0,
        top: '100%',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        marginTop: '0.5rem',
        zIndex: 100,
        minWidth: '150px'
      }}>
        <div
          onClick={() => {
            setShowDropdown(false)
            navigate('/profile')
          }}
          style={{
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            borderBottom: '1px solid #eee'
          }}
        >
          Profile
        </div>
        <div
          onClick={() => {
            setShowDropdown(false)
            localStorage.removeItem('localUser')
            logout({ logoutParams: { returnTo: window.location.origin } })
          }}
          style={{
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            color: 'red'
          }}
        >
          Logout
        </div>
      </div>
    )}
  </div>
)}

      </div>
    </header>
  )
}

export default Header
