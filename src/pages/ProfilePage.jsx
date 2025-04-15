// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

function ProfilePage({ localUser, authUser }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!localUser?.id) return;

    api.get(`/users/${localUser.id}`)
      .then(res => {
        setProfile(res.data);
        setName(res.data.name);
        setTitle(res.data.title || '');
      })
      .catch(err => console.error('Failed to load profile:', err));
  }, [localUser]);

  const handleSave = () => {
    api.put(`/users/${localUser.id}`, { name, title })
      .then(() => alert('Profile updated!'))
      .catch(err => alert('Error updating profile'));
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="profile-page" style={{ padding: '2rem' }}>
      <h2>My Profile</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label><strong>Name:</strong></label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label><strong>Title:</strong></label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Secondary Teacher"
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label><strong>Email:</strong></label>
        <input
          value={authUser?.email || ''}
          readOnly
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', background: '#f0f0f0' }}
        />
      </div>

      <button
        onClick={handleSave}
        style={{ padding: '0.75rem 1.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        Save Changes
      </button>
    </div>
  );
}

export default ProfilePage;
