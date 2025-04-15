import React, { useState, useEffect } from 'react';
import api from '../api';
import PersonImage from '../assets/PersonIcon.png';
import PollBlock from './PollBlock'; 

function PostCard({ post, userId, onVote, onPostDeleted, onCustomVote, localUser, syncingPolls, pollSyncErrors }) {
  const poll = post.poll;
  const [chosenOption, setChosenOption] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [customOptionText, setCustomOptionText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const isAdmin = localUser?.role === 'admin';
  const isPostOwner = post.user_id === userId;

  useEffect(() => {
    const voted = poll?.options?.find(opt => opt.user_voted);
    setChosenOption(voted?.id || null);

    // Fetch comments for this post
    api.get(`/comments/post/${post.id}`)
      .then(res => setComments(res.data))
      .catch(err => console.error('Failed to load comments:', err));
  }, [poll, post.id]);

  const handleAddComment = async () => {
    if (!userId || userId === 0) {
      alert('Please log in to comment.');
      return;
    }
  
    if (!newComment.trim()) return;
  
    try {
      const res = await api.post('/comments/create', {
        post_id: post.id,
        user_id: userId,
        content: newComment
      });
  
      const newCommentFromBackend = res.data; // backend sends full comment with image
      setComments(prev => [...prev, newCommentFromBackend]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };
  

  
  

  const toggleCommentVote = async (comment) => {
    if (!userId || userId === 0) {
      alert('Please log in to vote on comments.');
      return;
    }
  
    const hasVoted = Array.isArray(comment.voters) && comment.voters.some(v => v.user_id === userId);
  
    try {
      if (hasVoted) {
        await api.delete(`/comments/${comment.id}/vote`, {
          data: { user_id: userId }
        });
      } else {
        await api.post(`/comments/${comment.id}/vote`, {
          user_id: userId
        });
      }
  
      setComments(prev => prev.map(c => {
        if (c.id !== comment.id) return c;
  
        const updatedVoters = hasVoted
          ? (Array.isArray(c.voters) ? c.voters.filter(v => v.user_id !== userId) : [])
          : [...(Array.isArray(c.voters) ? c.voters : []), { user_id: userId, user_name: 'You' }];
  
        const updatedVoteCount = hasVoted
          ? Math.max((c.vote_count || 1) - 1, 0)
          : (c.vote_count || 0) + 1;
  
        return {
          ...c,
          voters: updatedVoters,
          vote_count: updatedVoteCount
        };
      }));
    } catch (err) {
      console.error('Failed to toggle comment vote:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
  
    try {
      await api.delete(`/posts/delete/${post.id}`);
      alert('Post deleted successfully');
      if (typeof onPostDeleted === 'function') {
        onPostDeleted(post.id); 
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Error deleting post');
    }
  };

  

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
  
    try {
      await api.delete(`/comments/delete/${commentId}`, {
        data: {
          user_id: userId,
          is_admin: isAdmin 
        }
      });
  
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Error deleting comment');
    }
  };

  
  

  return (
    <div className="post-card">
      <div className="post-card-header">
        <div className="user-info">
        <img
        src={post.profile_image}
        alt="User Avatar"
        className="user-avatar"
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = PersonImage;
        }}
      />
      
          <div className="user-details">
            <strong>{post.author}</strong>
            {post.author_title && (
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {post.author_title}
            </div>
          )}

          </div>
        </div>
        {(isPostOwner || isAdmin) && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowOptions(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0 0.5rem'
            }}
            title="More options"
          >
            ⋮
          </button>
          {showOptions && (
            <div style={{
              position: 'absolute',
              right: 0,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              padding: '0.25rem',
              zIndex: 10
            }}>
              <div
                onClick={handleDeletePost}
                style={{
                  cursor: 'pointer',
                  padding: '0.25rem 0.75rem',
                  color: 'red',
                  fontSize: '0.9rem'
                }}
              >
                Delete Post
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      <div className="post-card-title">{post.title}</div>
      <div className="post-card-description">{post.description}</div>

      {post.media.map(m =>
        m.type === 'image' ? (
          <img
            key={m.id}
            src={m.url} // ✅ use media URL here
            alt="Post media"
            className="post-media"
            style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '0.5rem' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = PersonImage;
            }}
          />
        ) : null
      )}


      {poll && (
        <PollBlock
        poll={poll}
        postId={post.id}
        userId={userId}
        onVote={onVote}
        onCustomVote={onCustomVote}
        syncing={syncingPolls.has(poll.id)}
        error={pollSyncErrors.get(poll.id)}
      />
      
      )}


      {/* COMMENTS */}
      <div style={{ marginTop: '1rem' }}>
        <strong>Comments</strong>
        <div>
        {comments.map(c => {
          const userVoted = c.voters.some(v => v.user_id === userId);
          const isCommentOwner = c.user_id === userId;

          return (
            <div key={c.id} className="comment-block" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
              <img
              src={c.profile_image}
              alt="User Avatar"
              className="user-avatar"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = PersonImage;
              }}
            />
              <div>
                <span style={{ fontWeight: 'bold' }}>{c.user_name}:</span> {c.content}
                <button
                  onClick={() => toggleCommentVote(c)}
                  style={{
                    marginLeft: '0.5rem',
                    background: userVoted ? '#66bb6a' : '#ddd',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  👍 {c.vote_count}
                </button>
    
                {(isCommentOwner || isAdmin) && (
                  <span
                    className="comment-delete"
                    onClick={() => handleDeleteComment(c.id)}
                    style={{ marginLeft: '0.5rem', color: 'red', cursor: 'pointer' }}
                  >
                    Delete
                  </span>
                )}
              </div>
            </div>
          );
        })}

        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            style={{ width: '80%', padding: '0.5rem' }}
          />
          <button
            onClick={handleAddComment}
            style={{
              marginLeft: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Post
          </button>
        </div>
      </div>

      <div className="post-card-footer">
        <div>10 comments</div>
        <div>Last reply 10 hours ago</div>
      </div>
    </div>
  );
}

export default PostCard;
