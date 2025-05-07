//frontend\src\components\PostCard.jsx

import React, { useState, useEffect, useContext, useRef  } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm           from 'remark-gfm';        // ★
import remarkBreaks        from 'remark-breaks';     // ★
import rehypeSanitize      from 'rehype-sanitize';   // ★
import PersonImage from '../assets/PersonIcon.png';
import PollBlock from './PollBlock'; 
import PostContext from '../context/PostContext';
import PollContext from '../context/PollContext';
import CommentSection from './CommentSection';
import useLoginGate from '../hooks/useLoginGate';
import { Flag } from 'lucide-react';          
import useFlagModal from '../hooks/useFlagModal';
import '../styles/postCard.css';


function PostCard({ post, userId, onVote, onPostDeleted, onCustomVote, localUser, showComments = true }) {
  const { flag, FlagModal } = useFlagModal(localUser);
  const { guard, LoginModal } = useLoginGate(localUser);
  const optionsRef = useRef(); 
  const poll = post.poll;
  const [chosenOption, setChosenOption] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [customOptionText, setCustomOptionText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const isAdmin = localUser?.role === 'admin';
  const isPostOwner = post.user_id === userId;
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent,   setEditingContent]   = useState('');

  const { vote, updating } = useContext(PostContext);
  const { syncingPolls, pollSyncErrors } = useContext(PollContext);
  const { loading } = useContext(PostContext);

  const busy = updating.has(post.id);
  const [score, setScore]   = useState(post.score);     // comes from backend
  // 1. Initialize from the two booleans
  const [myVote, setMyVote] = useState(() => {
    if (post.user_vote_up)   return  1;
    if (post.user_vote_down) return -1;
    return 0;
  });

  // close the “⋮” menu when clicking outside it
  useEffect(() => {
    function onDocClick(e) {
      if (showOptions && optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showOptions]);

  

  // 2. Keep it in sync if the post prop changes
  useEffect(() => {
    if (post.user_vote_up)   setMyVote(1);
    else if (post.user_vote_down) setMyVote(-1);
    else                       setMyVote(0);
  }, [post.user_vote_up, post.user_vote_down]);


  useEffect(() => {
    const voted = poll?.options?.find(opt => opt.user_voted);
    setChosenOption(voted?.id || null);

    if (!showComments) return;

    // Fetch comments for this post
    api.get(`/comments/post/${post.id}`)
      .then(res => setComments(res.data))
      .catch(err => console.error('Failed to load comments:', err));
  }, [poll, post.id]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail.postId === post.id) {
        setScore(e.detail.newScore);
        setMyVote(e.detail.userVote);
      }
    };
    window.addEventListener('post-vote', handler);
    return () => window.removeEventListener('post-vote', handler);
  }, [post.id]);

  const doToggleUp   = () => {
        const newVal = myVote === 1 ? 0 : 1;
        vote(post.id, newVal);
      };

  const doToggleDown = () => {
        const newVal = myVote === -1 ? 0 : -1;
        vote(post.id, newVal);
      };
  
  const toggleUp   = () => guard(doToggleUp);

  const toggleDown = () => guard(doToggleDown);
  

  function startEditing(comment) {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  }

  // when you click “Save”
  async function saveEdit(commentId) {
    try {
      await api.put(`/comments/${commentId}`, {
        user_id: userId,
        content: editingContent
      });
      // update local list
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, content: editingContent } : c
        )
      );
      setEditingCommentId(null);
    } catch (err) {
      console.error('Could not save comment edit', err);
      alert('Failed to save your edits');
    }
  }



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

  return (
    <div className="post-card">
      {/* ─────────── HEADER ─────────── */}
      <div className="post-card-header">
        {/* ← Avatar + author */}
        <div
          className="user-info"
        >
          <Link to={`/profile/${post.user_id}`}>
            <img
              src={post.profile_image || PersonImage}
              alt="User Avatar"
              className="user-avatar"
              referrerPolicy="no-referrer"
              onError={e => {
                e.target.onerror = null;
                e.target.src = PersonImage;
              }}
            />
          </Link>
  
          <div>
            <strong>{post.author}</strong>
            {post.author_position && (
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {post.author_position}
              </div>
            )}
          </div>
        </div>
  
        {/* → Vote buttons + 3-dot menu */}
        <div>
          {/* vote column */}
          <div className="vote-col">
            <button
              className={`vote-btn up ${myVote === 1 ? 'voted' : ''} ${
                busy ? 'syncing' : ''
              }`}
              disabled={busy}
              onClick={toggleUp}
            >
              ▲
            </button>
  
            <div className="score">{score}</div>
  
            <button
              className={`vote-btn down ${myVote === -1 ? 'voted' : ''} ${
                busy ? 'syncing' : ''
              }`}
              disabled={busy}
              onClick={toggleDown}
            >
              ▼
            </button>
          </div>
  
          {/* 3-dot options */}
          <div
            className="post-moreWrap"
            ref={optionsRef}
          >
            <button
              className="post-moreBtn"
              onClick={() => setShowOptions(o => !o)}
              title="More options"
            >
              ⋮
            </button>
  
            {showOptions && (
              <div className="options-menu">
                {/* report – everyone */}
                <div
                  className="options-menu__item"
                  onClick={() => {
                    flag('post', post.id);
                    setShowOptions(false);
                  }}
                >
                  <Flag size={14} /> Report post
                </div>
  
                {/* delete – owner or admin */}
                {(post.user_id === userId || localUser?.role === 'admin') && (
                  <div
                    className="options-menu__item options-menu__item--danger"
                    onClick={handleDeletePost}
                  >
                    Delete post
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ────── /HEADER ────── */}
  
      {/* modals (render but hidden until triggered) */}
      {FlagModal()}
      {LoginModal}
  
      {/* ─────────── BODY ─────────── */}
      <div className="post-card-title">{post.title}</div>

      <div className="post-card-description prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeSanitize]}
          components={{
                  a: ({node, ...props}) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                }}
        >
          {post.description || ''}
        </ReactMarkdown>
      </div>
  
      {/* media images */}
      {Array.isArray(post.media) &&
        post.media.map(
          m =>
            m.type === 'image' && (
              <img
                key={m.id}
                src={m.url}
                alt="Post media"
                className="post-media"
                style={{
                  maxWidth: '100%',
                  borderRadius: '8px',
                  marginTop: '0.5rem'
                }}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = PersonImage;
                }}
              />
            )
        )}
  
      {/* poll block */}
      {poll && (
        <PollBlock
          poll={poll}
          postId={post.id}
          userId={userId}
          onVote={onVote}
          onCustomVote={onCustomVote}
          syncing={syncingPolls.has(poll.id)}
          error={pollSyncErrors.get(poll.id)}
          guard={guard}
        />
      )}
  
      {/* comments */}
      {showComments && (
        <CommentSection
          postId={post.id}
          userId={userId}
          localUser={localUser}
          guard={guard}
        />
      )}
      {/* ────── /BODY ────── */}
    </div>
  );
}
  

export default PostCard;
