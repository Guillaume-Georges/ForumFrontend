// src/components/PollBar.jsx
import React from 'react'

function PollBar() {
  // Hard-coded example placeholders for "Yes / No / Maybe"
  return (
    <div className="poll-options">
      <div className="poll-option">
        <div className="poll-option-filled" style={{ width: '50%' }}></div>
      </div>
      <div className="poll-option">
        <div className="poll-option-filled" style={{ width: '30%', background: '#29b6f6' }}></div>
      </div>
      <div className="poll-option">
        <div className="poll-option-filled" style={{ width: '20%', background: '#ffa726' }}></div>
      </div>
    </div>
  )
}

export default PollBar
