// LatestPosts.jsx
import React from 'react'
import PostCard from './PostCard'

function LatestPosts({ posts, onVote, userId, onPostDeleted, localUser, onCustomVote, syncingPolls, pollSyncErrors }) {
  return (
    <div>
      <h3>Latest Posts</h3>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          onVote={onVote}
          onCustomVote={onCustomVote} 
          onPostDeleted={onPostDeleted}
          localUser={localUser} 
          syncingPolls={syncingPolls}
          pollSyncErrors={pollSyncErrors}
        />
      ))}
    </div>
  )
}
export default LatestPosts
