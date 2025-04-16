// src/pages/HomePage.jsx
import React, { useContext } from 'react';
import MainFeed from '../components/MainFeed';
import LatestPosts from '../components/LatestPosts';
import PollContext from '../context/PollContext';

function HomePage({ localUser }) {
  const { posts } = useContext(PollContext);

  const latest = posts.slice(0, 5);

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));
  };

  return (
    <div className="layout">
      <div className="feed">
        <MainFeed posts={posts} userId={localUser?.id || 0} localUser={localUser} onPostDeleted={handlePostDeleted} />
      </div>
      <div className="sidebar">
        <LatestPosts posts={latest} userId={localUser?.id || 0} localUser={localUser} onPostDeleted={handlePostDeleted} />
      </div>
    </div>
  );
}

export default HomePage;
