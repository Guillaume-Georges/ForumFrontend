import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import PersonImage from '../assets/PersonIcon.png'; // Default avatar

// Basic styling (consider moving to a CSS file)
const styles = {
  container: {
    maxWidth: '900px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #eee',
  },
  profileImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '1.5rem',
    border: '3px solid #ddd',
  },
  profileInfo: {
    flexGrow: 1,
  },
  profileName: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    margin: '0 0 0.25rem 0',
  },
  postsSection: {
    marginTop: '2rem',
  },
  postsHeader: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#777',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: 'red',
  },
  noPosts: {
    textAlign: 'center',
    padding: '2rem',
    color: '#777',
  },
};

function PublicProfilePage({ localUser }) {
  const { userId } = useParams(); // Get the user ID from the URL parameter
  const [profileInfo, setProfileInfo] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [postsError, setPostsError] = useState(null);

  useEffect(() => {
    console.log('Fetching profile and posts for user ID:', userId);

    // Reset states when userId changes
    setIsLoadingProfile(true);
    setIsLoadingPosts(true);
    setProfileInfo(null);
    setUserPosts([]);
    setProfileError(null);
    setPostsError(null);

    // Fetch profile information
    api.get(`/users/${userId}`)
      .then(res => {
        console.log('Profile fetched:', res.data);  // Log the profile data
        setProfileInfo(res.data);
        setProfileError(null);
      })
      .catch(err => {
        console.error('Failed to load profile info:', err);
        setProfileError('Could not load profile information.');
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });

    // Fetch user's posts using the NEW backend route
    // IMPORTANT: Make sure this route exists on your backend!
    api.get(`/users/${userId}/posts`)
      .then(res => {
        console.log('User posts fetched:', res.data);  // Log the posts data
        setUserPosts(res.data);
        setPostsError(null);
      })
      .catch(err => {
        console.error('Failed to load user posts:', err);
        setPostsError('Could not load posts.');
      })
      .finally(() => {
        setIsLoadingPosts(false);
      });
  }, [userId]); // Re-run fetches if the userId in the URL changes

  // Add a loading state that waits until both profile and posts are loaded
  if (isLoadingProfile || isLoadingPosts) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (profileError) {
    return <div style={styles.error}>{profileError}</div>;
  }

  if (postsError) {
    return <div style={styles.error}>{postsError}</div>;
  }

  if (!profileInfo) {
    return <div style={styles.error}>Profile not found.</div>;
  }

  return (
    <div style={styles.container}>
      {/* Profile Header Section */}
      <div style={styles.profileHeader}>
        <img
          src={profileInfo.profile_image || PersonImage}
          alt={`${profileInfo.name}'s profile`}
          style={styles.profileImage}
        />
        <div style={styles.profileInfo}>
          <h1 style={styles.profileName}>{profileInfo.name}</h1>
          {profileInfo.position && <p>{profileInfo.position}</p>}
        </div>
      </div>

      {/* Posts Section */}
      <div style={styles.postsSection}>
        <h2 style={styles.postsHeader}>{profileInfo.name}'s Posts</h2>

        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <div key={post.id} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <div style={{ color: '#777', fontSize: '0.9rem' }}>Posted on: {new Date(post.created_at).toLocaleDateString()}</div>
            </div>
          ))
        ) : (
          <div style={styles.noPosts}>This user hasn't published any posts yet.</div>
        )}
      </div>
    </div>
  );
}

export default PublicProfilePage;
