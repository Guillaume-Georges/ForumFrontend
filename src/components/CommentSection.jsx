// src/components/CommentSection.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom'; 
import api from '../api';
import SimpleMDE from 'react-simplemde-editor';
import ReactMarkdown from 'react-markdown'; 
import PersonImage from '../assets/PersonIcon.png';
import 'easymde/dist/easymde.min.css';
import PostContext from '../context/PostContext';

function CommentSection({ postId, userId, localUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const editorRef = useRef(null);
  const { setPosts, setLatestPosts } = React.useContext(PostContext);

  /* edit / admin state */
  const [editingId,    setEditingId]    = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const isAdmin = localUser?.role === 'admin';

  /* ─────────────────── fetch comments ─────────────────── */
  useEffect(() => {
    api.get(`/comments/post/${postId}`)
      .then(res => setComments(res.data))
      .catch(console.error);
  }, [postId]);

  /* ─────────────────── add comment ─────────────────── */
  const handleAddComment = async () => {
    if (!userId) return alert('Please log in.');
    if (!newComment.trim()) return;

    try {
      const res = await api.post('/comments/create', {
        post_id: postId,
        user_id: userId,
        content: newComment
      });
      const newCommentObj = {
             ...res.data,                
             user_id:       userId,
             user_name:     localUser.name,
             profile_image: localUser.profile_image,
             voters:        [],
             vote_count:    0
           };
      setComments(prev => [...prev, newCommentObj]);
      /* --- keep MainFeed synced --- */
     const enrich = p =>
          p.id === postId
            ? {
                ...p,
                comment_count: (p.comment_count || 0) + 1,
                last_reply_ts: Date.now()
              }
            : p;
        setPosts?.(prev => prev.map(enrich));
  
        /* --- bump / insert into LatestPosts like PollProvider does --- */
        setLatestPosts?.(prev => {
          const updatedFirst = enrich(
            prev.find(p => p.id === postId) ||
            posts.find(p => p.id === postId) ||   // fallback from main feed
            { id: postId }                        // edge case
          );
          return [updatedFirst, ...prev.filter(p => p.id !== postId)].slice(0, 5);
        });
            
             
      
      setNewComment('');
      setShowEditor(false);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  /* ─────────────────── vote toggle ─────────────────── */
  const toggleCommentVote = async (comment) => {
    if (!userId) return alert('Please log in to vote.');

    const hasVoted =
      Array.isArray(comment.voters) &&
      comment.voters.some(v => v.user_id === userId);

    try {
      if (hasVoted) {
        await api.delete(`/comments/${comment.id}/vote`, {
          data: { user_id: userId }
        });
      } else {
        await api.post(`/comments/${comment.id}/vote`, { user_id: userId });
      }

      setComments(prev =>
        prev.map(c => {
          if (c.id !== comment.id) return c;

          const voters = Array.isArray(c.voters) ? c.voters : [];
          const updatedVoters = hasVoted
            ? voters.filter(v => v.user_id !== userId)
            : [...voters, { user_id: userId }];

          return {
            ...c,
            voters: updatedVoters,
            vote_count: hasVoted
              ? Math.max(c.vote_count - 1, 0)   // ✅ “− 1”
              : c.vote_count + 1                // ✅ “+ 1”
          };
        })
      );
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  /* ─────────────────── edit helpers ─────────────────── */
  const startEdit = (c) => {
    setEditingId(c.id);
    setEditingValue(c.content);
  };

  const saveEdit = async (commentId) => {
    try {
      await api.put(`/comments/${commentId}`, {
        user_id: userId,
        content: editingValue
      });
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, content: editingValue } : c
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error('Could not save edit', err);
      alert('Failed to save your edits');
    }
  };

  /* ─────────────────── delete ─────────────────── */
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/delete/${commentId}`, {
        data: { user_id: userId, is_admin: isAdmin }
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  /* ─────────────────── EasyMDE setup ─────────────────── */
  const handleCommentChange = useCallback(val => setNewComment(val), []);

  const editorOptions = useMemo(
    () => ({
      placeholder: 'Write your comment…',
      spellChecker: false,
      status: false,
      autofocus: true,
      toolbar: [
        'bold',
        'italic',
        'strikethrough',
        '|',
        'heading',
        'quote',
        'code',
        '|',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        '|',
        'undo',
        'redo'
      ]
    }),
    []
  );

  /* autofocus after mount */
  useEffect(() => {
    if (showEditor && editorRef.current) {
      const t = setTimeout(() => {
        editorRef.current?.simpleMde?.codemirror.focus();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [showEditor]);

  /* ─────────────────── render ─────────────────── */
  return (
    <div className="comments-section">
      <strong>Comments</strong>

      {comments.map(c => {
        const isAuthor = c.user_id === userId;
        const profileLink = `/profile/${c.user_id}`;

        return (
          <div key={c.id} className="comment-block" style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem' }}>
            <Link to={profileLink}>
              <img
                src={c.profile_image || PersonImage}
                alt="avatar"
                className="user-avatar"
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = PersonImage;
                }}
              />
            </Link>

            <div style={{ flex: 1 }}>
              <strong>{c.user_name}</strong>

              {editingId === c.id ? (
                <>
                  <textarea
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    style={{ width: '100%', marginTop: '.25rem' }}
                  />
                  <div style={{ marginTop: '.25rem' }}>
                    <button onClick={() => saveEdit(c.id)}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ marginLeft: '.5rem' }}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <ReactMarkdown>{c.content}</ReactMarkdown>
                  <button onClick={() => toggleCommentVote(c)} style={{ marginLeft: '.5rem' }}>
                    👍 {c.vote_count}
                  </button>

                  {(isAuthor || isAdmin) && (
                    <>
                      <button onClick={() => startEdit(c)} style={{ marginLeft: '.5rem' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteComment(c.id)} style={{ marginLeft: '.5rem', color: 'red' }}>
                        Delete
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Composer placeholder / editor */}
      {!showEditor ? (
        <div
          role="textbox"
          tabIndex={0}
          onClick={() => setShowEditor(true)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setShowEditor(true)}
          style={{
            marginTop: '1rem',
            padding: '.6rem',
            width: '100%',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: '#fafafa',
            cursor: 'text',
            color: '#666'
          }}
        >
          Write a comment…
        </div>
      ) : (
        <>
          <SimpleMDE
            ref={editorRef}
            value={newComment}
            onChange={handleCommentChange}
            options={editorOptions}
          />
          <button
            onClick={handleAddComment}
            style={{
              padding: '.5rem 1rem',
              background: '#007bff',
              color: '#fff',
              borderRadius: '4px',
              border: 'none',
              marginTop: '.5rem'
            }}
          >
            Post Comment
          </button>
          <button
            onClick={() => {
              setShowEditor(false);
              setNewComment('');
            }}
            style={{
              padding: '.5rem 1rem',
              background: '#ccc',
              border: 'none',
              borderRadius: '4px',
              marginTop: '.5rem',
              marginLeft: '.5rem'
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