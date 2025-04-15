// MainFeed.jsx
import React from 'react'
import PostCard from './PostCard'

function MainFeed({ posts, onVote, userId, onPostDeleted, localUser, onCustomVote, syncingPolls, pollSyncErrors }) {
  return (
    <div>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          onVote={onVote}
          onCustomVote={onCustomVote} // ✅ receive from props
          onPostDeleted={onPostDeleted}
          localUser={localUser} 
          syncingPolls={syncingPolls}
        pollSyncErrors={pollSyncErrors}
        />
      ))}
    </div>
  )
}
export default MainFeed
