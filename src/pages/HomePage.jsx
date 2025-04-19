import React, { useContext } from 'react';
import MainFeed     from '../components/MainFeed';
import LatestPosts  from '../components/LatestPosts';
import PostContext  from '../context/PostContext';

function HomePage({ localUser }) {
  const { posts, latestPosts, setPosts, setLatestPosts } =
    useContext(PostContext);

  const handlePostDeleted = deletedId => {
    setPosts(p  => p.filter(post  => post.id !== deletedId));
    setLatestPosts(lp => lp.filter(post => post.id !== deletedId));
  };

  return (
    <div className="layout">
      <div className="feed">
        <MainFeed
          posts={posts}
          userId={localUser?.id || 0}
          localUser={localUser}
          onPostDeleted={handlePostDeleted}
        />
      </div>

      <div className="sidebar">
        <LatestPosts
          posts={latestPosts}
          userId={localUser?.id || 0}
          localUser={localUser}
          onPostDeleted={handlePostDeleted}
        />
      </div>
    </div>
  );
}

export default HomePage;
