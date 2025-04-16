// src/components/CommentSection.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom'; 
import api from '../api';
import SimpleMDE from 'react-simplemde-editor';
import ReactMarkdown from 'react-markdown';
import PersonImage from '../assets/PersonIcon.png';
import 'easymde/dist/easymde.min.css';

function CommentSection({ postId, userId, localUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    api.get(`/comments/post/${postId}`)
      .then(res => setComments(res.data))
      .catch(console.error);
  }, [postId]);

  const handleAddComment = async () => {
    if (!userId) return alert('Please log in.');
    if (!newComment.trim()) return;

    try {
      const res = await api.post('/comments/create', {
        post_id: postId,
        user_id: userId,
        content: newComment
      });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      setShowEditor(false);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const toggleCommentVote = async (comment) => {
    const hasVoted = comment.voters.some(v => v.user_id === userId);
    try {
      if (hasVoted) {
        await api.delete(`/comments/${comment.id}/vote`, { data: { user_id: userId } });
      } else {
        await api.post(`/comments/${comment.id}/vote`, { user_id: userId });
      }
      setComments(prev => prev.map(c => c.id === comment.id ? {
        ...c,
        voters: hasVoted ? c.voters.filter(v => v.user_id !== userId) : [...c.voters, { user_id: userId }],
        vote_count: hasVoted ? c.vote_count - 1 : c.vote_count + 1,
      } : c));
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/delete/${commentId}`, {
        data: { user_id: userId, is_admin: localUser.role === 'admin' }
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const memoizedOnChange = useCallback((value) => {
    setNewComment(value);
  }, []);

  const editorOptions = useRef({
    placeholder: 'Write your comment...',
    spellChecker: false,
    toolbar: [
      'bold', 'italic', 'strikethrough', '|',
      'heading', 'quote', 'code', '|',
      'unordered-list', 'ordered-list', '|',
      'link', '|',
      'undo', 'redo'
    ],
    status: false,
  }).current;
  

  useEffect(() => {
    if (showEditor && editorRef.current) {
      const timer = setTimeout(() => {
        if (editorRef.current.simpleMde) {
          editorRef.current.simpleMde.codemirror.focus();
        }
      }, 300);  // A short delay ensures SimpleMDE is initialized
  
      return () => clearTimeout(timer);
    }
  }, [showEditor]);
  

  return (
    <div className="comments-section">
      <strong>Comments</strong>

      {comments.map(c => {
        const isAuthor = c.user_id === userId;
        const isAdmin = localUser?.role === 'admin';
        const profileLinkTarget = `/profile/${c.user_id}`;
        return (
          <div key={c.id} className="comment-block">
            <Link to={profileLinkTarget} title={`View ${c.user_name}'s profile`}>
              <img
                src={c.profile_image || PersonImage}
                alt={`${c.user_name}'s avatar`}
                className="user-avatar"
              />
            </Link>
              <div className="comment-content">
              <strong>{c.user_name}</strong>
              <ReactMarkdown>{c.content}</ReactMarkdown>
              <button onClick={() => toggleCommentVote(c)}>
                👍 {c.vote_count}
              </button>
              {(isAuthor || isAdmin) && (
                <span 
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

      {!showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem',
            width: '100%',
            borderRadius: '4px',
            border: '1px solid #ddd',
            textAlign: 'left',
            background: '#fafafa',
            cursor: 'text',
            color: '#666'
          }}
        >
          Write a comment...
        </button>
      )}

      {showEditor && (
        <>
          <SimpleMDE
            ref={editorRef}
            value={newComment}
            onChange={memoizedOnChange}
            options={editorOptions}
          />
          <button
            onClick={handleAddComment}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              marginTop: '0.5rem'
            }}
          >
            Post Comment
          </button>
          <button
            onClick={() => { setShowEditor(false); setNewComment(''); }}
            style={{
              padding: '0.5rem 1rem',
              background: '#ccc',
              borderRadius: '4px',
              border: 'none',
              marginTop: '0.5rem',
              marginLeft: '0.5rem'
            }}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

export default CommentSection;
