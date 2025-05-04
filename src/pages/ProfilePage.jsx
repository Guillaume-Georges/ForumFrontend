// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import Loading from '../components/Loading';
import '../styles/profile.css'; 

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

  async function handleDelete() {
    const ok = window.confirm(
      `⚠️  This will permanently erase your account and *everything* you’ve
       ever posted, voted on or commented.  There is no way to undo this.  
       Do you really want to continue?`
    );
    if (!ok) return;
  
    try {
      await api.delete(`/users/${localUser.id}`, { data: { id: localUser.id } });
      /* flag the welcome message, then redirect */
      sessionStorage.setItem('accountDeleted', '1');
      localStorage.clear();          // wipe cached login
      window.location.href = '/';    // go to home
    } catch {
      alert('Deletion failed — please try again.');
    }
  }
  

  if (!profile) return <Loading label="Loading profile…" />;

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

    {/* Profile actions */}
    <div className="profile-actions">
      <button
        className="btn btn--danger"
        onClick={handleDelete}
      >
        Delete my account
      </button>

      <button
        className="btn btn--primary"
        onClick={handleSave}
      >
        Save changes
      </button>
    </div>
    
    </div>
  );
}

export default ProfilePage;
