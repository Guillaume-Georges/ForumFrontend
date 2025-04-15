// src/components/NavBar.jsx
import React from 'react'
import { Link } from 'react-router-dom'

function NavBar() {
  return (
    <div className="navbar">
      <div className="navbar-tabs">
        <button className="active">Discussions</button>
        <button>Following</button>
      </div>
      <div className="navbar-sort">
        Sort: Latest
      </div>
      <button className="navbar-addpost">
        <Link to="/create-post" style={{ color: '#fff', textDecoration: 'none' }}>
            + Add a Post
        </Link>
    </button>
    </div>
  )
}

export default NavBar
