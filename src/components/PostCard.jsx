import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import PersonImage from '../assets/PersonIcon.png';
import PollBlock from './PollBlock';
import PollContext from '../context/PollContext';
import CommentSection from './CommentSection';

const profileLinkStyle = {
  textDecoration: 'none',
  color: 'inherit', // Inherit color from parent
  display: 'flex',  // Make the link container flexible for layout
  alignItems: 'center'
};

function PostCard({ post, userId, onPostDeleted, localUser, showComments, hideAuthorInfo  }) {
  const { syncingPolls, pollSyncErrors, handleVote, handleCustomVote } = useContext(PollContext);
  const poll = post.poll;

  const [showOptions, setShowOptions] = useState(false);
  const isAdmin = localUser?.role === 'admin';
  const isPostOwner = post.user_id === localUser?.id;

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/posts/delete/${post.id}`);
      onPostDeleted(post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Error deleting post');
    }
  };

  // Prevent navigation if post.user_id is missing for some reason
  const profileLinkTarget = post.user_id ? `/profile/${post.user_id}` : '#'; // Fallback to '#' if no user_id


  return (
    <div className="post-card">
      <div className="post-card-header">
        {/* Wrap the user info block in a Link */}
        {!hideAuthorInfo && (
        <Link to={profileLinkTarget} style={profileLinkStyle} title={`View ${post.author}'s profile`}>
          <div className="user-info">
            <img src={post.profile_image || PersonImage} alt={`${post.author}'s Avatar`} className="user-avatar" />
            <div className="user-details">
              <strong>{post.author}</strong>
              {post.author_title && <div style={{ fontSize: '0.8rem', color: '#666' }}>{post.author_title}</div>}
            </div>
          </div>
        </Link>
      )}

        {(isPostOwner || isAdmin) && (
          <div className="post-options-container" style={{ position: 'relative', marginLeft: 'auto' }}> {/* Added container and marginLeft */}
            <button onClick={() => setShowOptions(prev => !prev)} aria-label="Post options">⋮</button>
            {showOptions && (
              <div className="post-options">
                {/* Ensure delete uses the correct handler */}
                <div onClick={handleDeletePost} style={{ cursor: 'pointer' }}>Delete Post</div>
                {/* Add other options like 'Edit Post' here if needed */}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="post-card-title">{post.title}</div>
      <div className="post-card-description">{post.description}</div>

      {Array.isArray(post.media) && post.media.map(m =>
      m.type === 'image' && (
        <img key={m.id} src={m.url} alt="Post media" className="post-media" />
      )
    )}

      {poll && (
        <PollBlock
          poll={poll}
          postId={post.id}
          userId={userId}
          onVote={(postId, pollId, optionId) => handleVote(postId, pollId, optionId, userId)}
          onCustomVote={(postId, pollId, newOptionText) => handleCustomVote(postId, pollId, userId, newOptionText)}
          syncing={syncingPolls.has(poll.id)}
          error={pollSyncErrors.get(poll.id)}
        />
      )}

      {showComments && (
        <CommentSection
          postId={post.id}
          userId={userId}
          localUser={localUser}
        />
      )}

      <div className="post-card-footer">
        <div>{post.comment_count || 0} comments</div>
      </div>
    </div>
  );
}

export default PostCard;
