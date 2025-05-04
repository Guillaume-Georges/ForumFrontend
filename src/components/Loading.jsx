// src/components/Loading.jsx
import React from 'react';
import '../styles/loading.css';          // ⬅ CSS right below

function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-wrap">
      <div className="loading-spinner" />
      <p>{label}</p>
    </div>
  );
}

export default Loading;
