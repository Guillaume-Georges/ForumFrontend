// context/PostContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api';


const PostContext = createContext({
  posts: [],
  latestPosts: [],
  vote:   () => {},
  updating: new Set(),
  errors:   new Map(),
  loading: true,
  // setters exposed so PollContext can inject poll‑vote updates
  setPosts:       () => {},
  setLatestPosts: () => {},
});
  

export const PostProvider = ({ children, localUser }) => {
  /** ----- state that belongs to EVERY post, regardless of polls ----- */
  const [posts,       setPosts]       = useState([]); // vote‑sorted feed
  const [latestPosts, setLatestPosts] = useState([]); // 5 newest
  const [updating,    setUpdating]    = useState(new Set());
  const [errors,      setErrors]      = useState(new Map());
  const [loading, setLoading] = useState(true);


  /** ---------- fetch both feeds on mount / user change ----------- */
  useEffect(() => {
    let cancelled = false;

    async function fetchFeeds() {
      setLoading(true);
      try {
        const scoreParams  = { sortBy: 'votes',       ...(localUser && { user_id: localUser.id }) };
        const latestParams = { sortBy: 'date', limit: 5, ...(localUser && { user_id: localUser.id }) };

        const [scoreRes, latestRes] = await Promise.all([
          api.get('/posts/get',    { params: scoreParams  }),
          api.get('/posts/get',    { params: latestParams }),
        ]);

        if (cancelled) return;
        setPosts(scoreRes.data);
        setLatestPosts(latestRes.data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFeeds();
    return () => { cancelled = true; };
  }, [localUser]);

  /** -------------------- up‑ / down‑ voting ---------------------- */
  const vote = useCallback(
    async (postId, value) => {
      if (!localUser)          return alert('Please sign in to vote');
      if (![1, 0, -1].includes(value)) return;

      setUpdating(p => new Set(p).add(postId));

      try {
        const { data } = await api.post(`/posts/${postId}/vote`, {
          user_id: localUser.id,
          value,
        });
        /* data = { newScore, userVote, delta } — fire an event so any
           PostCard currently rendered can update immediately.           */
        window.dispatchEvent(
          new CustomEvent('post-vote', { detail: { postId, ...data } })
        );
        setErrors(e => { const m = new Map(e); m.delete(postId); return m; });
      } catch (err) {
        console.error(err);
        setErrors(e => new Map(e).set(postId, 'Vote failed'));
      } finally {
        setUpdating(p => { const s = new Set(p); s.delete(postId); return s; });
      }
    },
    [localUser]
  );


  return (
    <PostContext.Provider
      value={{
        posts,
        latestPosts,
        loading,
        setPosts,
        setLatestPosts,
        vote,
        updating,
        errors,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export default PostContext;
