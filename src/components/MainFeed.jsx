// MainFeed.jsx
import React from 'react';
import PostCard from './PostCard';

function MainFeed({ posts, userId, onPostDeleted, localUser }) {
  return (
    <div>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          onPostDeleted={onPostDeleted}
          localUser={localUser}
          showComments={true} // explicitly show comments
        />
      ))}
    </div>
  );
}

export default MainFeed;
