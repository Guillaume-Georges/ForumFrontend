import React, { useEffect, useState } from 'react';
import { useParams }           from 'react-router-dom';
import api                     from '../api';
import PersonImage             from '../assets/PersonIcon.png';
import PostCard                from '../components/PostCard';   // already built
import SocialLinks from '../components/SocialLinks';
import '../styles/PublicProfile.css';

function PublicProfilePage({ localUser }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [state,   setState]   = useState('loading'); // 'loading' | 'ok' | 'error'

  // normalise data so downstream components never crash
const safePosts = (Array.isArray(posts) ? posts : Object.values(posts || {}))
.map(p => ({
  ...p,
  media: Array.isArray(p.media) ? p.media : [],      // PostCard expects an array
}));


  useEffect(() => {
    let cancelled = false;
    setState('loading');
      api.get(`/users/${userId}/posts`)
      .then(({ data }) => {
        if (cancelled) return;
        const { user, posts } = data;
        setProfile(user);
        const raw = posts;
        setPosts(Array.isArray(raw) ? raw : Object.values(raw));
        setState('ok');
      })
      .catch(err => {
        console.error('Public profile fetch failed:', err);
        if (!cancelled) setState('error');
      });

    return () => { cancelled = true; };
  }, [userId]);

  /* ─────────────── UI states ─────────────── */
  if (state === 'loading') {
    return (
      <div className="pp‑skeleton">
        <div className="pp‑avatar" />
        <div className="pp‑line w40" />
        <div className="pp‑line w20" />
      </div>
    );
  }
  if (state === 'error' || !profile) {
    return <div className="pp‑error">Could not load this profile.</div>;
  }

  /* ─────────────── Render ─────────────── */
  return (
    <div className="pp‑wrap">
      {/* profile header */}
      <div className="pp‑header">
        <img
          src={profile.profile_image || PersonImage}
          alt="avatar"
          className="pp‑avatar"
          onError={e => (e.currentTarget.src = PersonImage)}
        />
        <div>
          <h1 className="pp‑name">{profile.name}</h1>
          {profile.position && <p className="pp‑position">{profile.position}</p>}
         {/* social icons here so they stack below the text */}
        <SocialLinks
          linkedin={profile.linkedin_url}
          facebook={profile.facebook_url}
          website={profile.website_url}
        />
        </div>
      </div>

      {/* posts */}
      <h2 className="pp‑posts‑title">Posts by {profile.name}</h2>

      {safePosts.length === 0 ? (
        <div className="pp‑no‑posts">This user hasn’t published anything yet.</div>
      ) : (
        safePosts.map((p, idx) => (
          <PostCard
            key={p.id ?? `u${idx}`} 
            post={p}
            userId={localUser?.id || 0}
            localUser={localUser}
            showComments={false}
          />
        ))
      )}
    </div>
  );
}

export default PublicProfilePage;
