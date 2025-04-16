// LatestPosts.jsx
import React from 'react';
import PostCard from './PostCard';

function LatestPosts({ posts, userId, onPostDeleted, localUser }) {
  return (
    <div>
      <h3>Latest Posts</h3>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          onPostDeleted={onPostDeleted}
          localUser={localUser}
          showComments={false} // explicitly hide comments
        />
      ))}
    </div>
  );
}

export default LatestPosts;
