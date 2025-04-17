// context/PostContext.jsx
import React, { createContext, useState, useCallback } from 'react';
import api from '../api';

const PostContext = createContext({
    posts: [],
    syncingPolls: new Set(),
    pollSyncErrors: new Map(),
    setPosts: () => {},
  });
  

export const PostProvider = ({ children, localUser }) => {
  const [updating, setUpdating] = useState(new Set());
  const [errors,   setErrors]   = useState(new Map());

  /**
   * @param {number} postId
   * @param {number} value   1 = up, -1 = down, 0 = un‑vote
   */
  const vote = useCallback(async (postId, value) => {
    if (!localUser)        return alert('Please sign in to vote');
    if (![1, 0, -1].includes(value)) return;   // safety net

    setUpdating(p => new Set(p).add(postId));

    try {
      const { data } = await api.post(`/posts/${postId}/vote`, {
        user_id: localUser.id,
        value                         // 1 | 0 | -1
      });

      /*  data = { newScore, userVote, delta }
          Fire a custom event so any PostCard holding this post
          can update its local score + arrow colour immediately.
      */
      window.dispatchEvent(new CustomEvent('post-vote', {
        detail: { postId, ...data }
      }));

      setErrors(e => { const m = new Map(e); m.delete(postId); return m; });
    } catch (err) {
      console.error(err);
      setErrors(e => new Map(e).set(postId, 'Vote failed'));
    } finally {
      setUpdating(p => { const s = new Set(p); s.delete(postId); return s; });
    }
  }, [localUser]);

  return (
    <PostContext.Provider value={{ vote, updating, errors }}>
      {children}
    </PostContext.Provider>
  );
};

export default PostContext;
