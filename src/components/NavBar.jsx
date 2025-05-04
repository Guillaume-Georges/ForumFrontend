// src/components/NavBar.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import useLoginGate from '../hooks/useLoginGate'

function NavBar({ localUser }) {
    const navigate = useNavigate();
    const { guard, LoginModal } = useLoginGate(localUser);
  
    return (
      <>
        <div className="navbar">
          <div className="navbar-tabs">
            <button
            className="active"
            onClick={() => navigate('/')}
          >
            Discussions
          </button>
            <button>Following</button>
          </div>
  
          <button
            className="navbar-addpost"
            onClick={() => guard(() => navigate('/create-post'))}
          >
            + Add a Post
          </button>
        </div>
  
        {LoginModal}
      </>
    );
  }

export default NavBar
