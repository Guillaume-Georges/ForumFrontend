// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

function ProfilePage({ localUser, authUser }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    if (!localUser?.id) return;

    api.get(`/users/${localUser.id}`)
      .then(res => {
        setProfile(res.data);
        setName(res.data.name);
        setPosition(res.data.position || '');
      })
      .catch(err => console.error('Failed to load profile:', err));
  }, [localUser]);

  const handleSave = () => {
    api.put(`/users/${localUser.id}`, { 
      name, 
      position,
      linkedin_url: profile?.linkedin_url,
      facebook_url: profile?.facebook_url,
      instagram_url: profile?.instagram_url,
      website_url: profile?.website_url
    })
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
        <label><strong>Position:</strong></label>
        <input
          value={position}
          onChange={e => setPosition(e.target.value)}
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

      <div style={{ marginBottom: '1rem' }}>
      <label><strong>LinkedIn:</strong></label>
      <input
        value={profile?.linkedin_url || ''}
        onChange={e => setProfile({...profile, linkedin_url: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
      />
    </div>

    <div style={{ marginBottom: '1rem' }}>
      <label><strong>Facebook:</strong></label>
      <input
        value={profile?.facebook_url || ''}
        onChange={e => setProfile({...profile, facebook_url: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
      />
    </div>

    <div style={{ marginBottom: '1rem' }}>
      <label><strong>Instagram:</strong></label>
      <input
        value={profile?.instagram_url || ''}
        onChange={e => setProfile({...profile, instagram_url: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
      />
    </div>

    <div style={{ marginBottom: '1rem' }}>
      <label><strong>Website:</strong></label>
      <input
        value={profile?.website_url || ''}
        onChange={e => setProfile({...profile, website_url: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
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
