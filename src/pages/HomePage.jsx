//frontend\src\pages\HomePage.jsx

import React, { useContext, useEffect } from 'react';
import MainFeed     from '../components/MainFeed';
import LatestPosts  from '../components/LatestPosts';
import PostContext  from '../context/PostContext';
import PollContext from '../context/PollContext';
import Loading from '../components/Loading';

function HomePage({ localUser }) {
  const { posts, latestPosts, setPosts, setLatestPosts, loading  } = useContext(PostContext);
  const { pollsLoading, pollsEnriched } = useContext(PollContext);

  const isPageLoading = loading || pollsLoading || !pollsEnriched;

  const handlePostDeleted = deletedId => {
    setPosts(p  => p.filter(post  => post.id !== deletedId));
    setLatestPosts(lp => lp.filter(post => post.id !== deletedId));
  };

  if (isPageLoading) return <Loading label="Fetching posts…" />;


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
