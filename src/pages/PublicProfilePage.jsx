// src/pages/PublicProfilePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard'; // Reuse the PostCard component
import PersonImage from '../assets/PersonIcon.png'; // Default avatar
import PollContext from '../context/PollContext'; // Needed for PostCard's context dependencies

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
  profileTitle: {
    fontSize: '1.1rem',
    color: '#555',
    margin: 0,
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
  }
};

function PublicProfilePage({ localUser }) {
  const { userId } = useParams(); // Get the user ID from the URL parameter
  const [profileInfo, setProfileInfo] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [postsError, setPostsError] = useState(null);

  // We might need PollContext here if PostCard deeply relies on it,
  // even if this specific page doesn't directly use voting functions.
  // Or refactor PostCard to conditionally use context.
  const pollContext = useContext(PollContext);

  useEffect(() => {
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
    api.get(`/users/post/${userId}`)
      .then(res => {
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

  const handlePostDeleted = (deletedPostId) => {
    setUserPosts(prevPosts => prevPosts.filter(p => p.id !== deletedPostId));
  };

  // Loading States
  if (isLoadingProfile || isLoadingPosts) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  // Error States
  if (profileError) {
    return <div style={styles.error}>{profileError}</div>;
  }
  // If profile loaded but posts failed, show profile but indicate post error
  // if (postsError) {
  //   // You might want a more nuanced display here
  //   return <div style={styles.error}>{postsError}</div>;
  // }

  if (!profileInfo) {
     // Should generally be covered by loading/error states, but as a fallback
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
          {profileInfo.title && <p style={styles.profileTitle}>{profileInfo.title}</p>}
          {/* Add more profile details here if needed, e.g., join date */}
        </div>
      </div>

      {/* Posts Section */}
      <div style={styles.postsSection}>
        <h2 style={styles.postsHeader}>{profileInfo.name}'s Posts</h2>
        {postsError && <div style={{...styles.error, marginBottom: '1rem'}}>{postsError}</div>}

        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              // Pass the *viewer's* user ID for context (e.g., checking vote status, ownership for delete)
              userId={localUser?.id}
              localUser={localUser} 
              onPostDeleted={handlePostDeleted}
              showComments={true} 
              hideAuthorInfo={true}
            />
          ))
        ) : (
           !postsError && <div style={styles.noPosts}>This user hasn't published any posts yet.</div>
        )}
      </div>
    </div>
  );
}

export default PublicProfilePage;