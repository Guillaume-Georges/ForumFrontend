import React, { createContext, useState, useCallback, useEffect, useContext, useRef, } from 'react';
import api from '../api';
import PostContext from './PostContext';


const PollContext = createContext();


export const PollProvider = ({ localUser, children }) => {
  /** ------- consume posts from PostContext (no own fetch) -------- */
  const {
    posts,
    latestPosts,
    setPosts,
    setLatestPosts,
    loading,
  } = useContext(PostContext);

  const [syncingPolls,  setSyncingPolls]  = useState(new Set());
  const [pollSyncErrors, setPollSyncErrors] = useState(new Map());
  const loggedOut = !localUser;
  const [pollsLoading,  setPollsLoading]  = useState(!loggedOut);
  const [pollsEnriched, setPollsEnriched] = useState(loggedOut);
  


  

/** ------- enrich posts with poll‑vote data whenever feeds load -- */
useEffect(() => {
    
  // run only once the feeds are loaded *and* a user is known
  if (!localUser) {
         if (pollsLoading)  setPollsLoading(false);
         if (!pollsEnriched) setPollsEnriched(true);
         return;
     }
  if (loading || pollsEnriched) return;

  const combined = [...posts, ...latestPosts];
  const pollIds  = combined.filter(p => p.poll?.id).map(p => p.poll.id);
  if (pollIds.length === 0) {
    setPollsLoading(false); // 👈 Ensure it's false if no polls exist
    setPollsEnriched(true);
    return;
  }

  let cancelled = false;
  setPollsLoading(true);

  (async () => {
    try {
      const { data: votes } = await api.post('/polls/votes/all', {
        poll_ids: pollIds,
      });

      const enrich = post => {
        if (!post.poll) return post;
         const updatedOptions = post.poll.options.map(opt => {
             // all votes for *this* option
             const optionVotes = votes.filter(
               v => v.poll_id === post.poll.id && v.option_id === opt.id
             );

             // If the endpoint didn’t include this option (e.g., custom option),
            // keep whatever the post already had.
            const voters = optionVotes.length > 0 ? optionVotes : (opt.voters ?? []);
          
             return {
               ...opt,
               voters,                        
               user_voted: voters.some(
                 v => v.user_id === localUser.id
               ),
             };
           });
        return { ...post, poll: { ...post.poll, options: updatedOptions } };
      };

      /* replace arrays only if at least one object reference changes */
      const replaceIfChanged = (prev, next) =>
      next.some((p, i) => p !== prev[i]) ? next : prev;

      if (!cancelled) {
        setPosts(prev => replaceIfChanged(prev, prev.map(enrich)));
        setLatestPosts(prev => replaceIfChanged(prev, prev.map(enrich)));
      }
    } catch (err) {
      console.error('Failed to load poll votes:', err);
    } finally {
      if (!cancelled) {
        setPollsLoading(false);
        setPollsEnriched(true); // 👈 prevent further unnecessary calls
      }
    }
  })();

  return () => { cancelled = true; };
}, [localUser, loading, pollsEnriched]);

  const handleVote = useCallback(
    async (postId, pollId, optionId, userId) => {
      setSyncingPolls(prev => new Set(prev).add(pollId));
  
      const optimisticUpdate = list =>
        list.map(post => {
          if (post.id !== postId || !post.poll) return post;
  
          const updatedOptions = post.poll.options
            .map(opt => {
              const base   = Array.isArray(opt.voters) ? opt.voters : [];
              const voters = base.filter(v => v.user_id !== userId);
  
              // un‑vote
              if (optionId === null) {
                return {
                  ...opt,
                  voters,
                  user_voted: false,
                  vote_count: opt.user_voted ? opt.vote_count - 1 : opt.vote_count,
                };
              }
  
              // regular vote
              if (opt.id === optionId) {
                return {
                  ...opt,
                  voters: [
                    ...voters,
                    {
                      user_id: userId,
                      user_name: localUser.name,
                      profile_image: localUser.profile_image,
                    },
                  ],
                  user_voted: true,
                  vote_count: opt.vote_count + 1,
                };
              }
  
              return { ...opt, voters, user_voted: false };
            })
            .filter(opt => !(opt.additional_option && opt.vote_count === 0));
  
          return { ...post, poll: { ...post.poll, options: updatedOptions } };
        });
  
      setPosts(optimisticUpdate);
      setLatestPosts(optimisticUpdate);
  
      try {
        if (optionId === null) {
          await api.delete(`/polls/${pollId}/vote`, { data: { user_id: userId } });
        } else {
          await api.post(`/polls/${pollId}/vote`, { user_id: userId, option_id: optionId });
        }
        setPollSyncErrors(prev => { const m = new Map(prev); m.delete(pollId); return m; });
      } catch (err) {
        setPollSyncErrors(prev => new Map(prev).set(pollId, 'Vote sync failed'));
        console.error(err);
      } finally {
        setSyncingPolls(prev => { const s = new Set(prev); s.delete(pollId); return s; });
      }
    },
    [localUser, setPosts, setLatestPosts]
  );

  const handleCustomVote = useCallback(
    async (postId, pollId, userId, newOptionText) => {
      setSyncingPolls(prev => new Set(prev).add(pollId));
  
      /** pure helper that adds the new option + voter */
      const optimistic = list =>
        list.map(post => {
          if (post.id !== postId || !post.poll) return post;
  
          const reset = post.poll.options
            .map(opt => ({
              ...opt,
              voters:       (Array.isArray(opt.voters) ? opt.voters : [])
                  .filter(v => v.user_id !== userId),
              user_voted:   false,
              vote_count:   opt.user_voted ? opt.vote_count - 1 : opt.vote_count,
            }))
            .filter(opt => !(opt.additional_option && opt.vote_count === 0));
  
          const newOption = {
            id:               'temp',          // temp id until server returns real one
            text:             newOptionText,
            vote_count:       1,
            user_voted:       true,
            additional_option:true,
            voters: [{
              user_id: userId,
              user_name: localUser.name,
              profile_image: localUser.profile_image,
            }],
          };
  
          return {
            ...post,
            poll: { ...post.poll, options: [...reset, newOption] },
          };
        });
  
      // 👉 optimistic UI *before* hitting the network
      setPosts(optimistic);
      setLatestPosts(optimistic);
  
      try {
        const { data } = await api.post(`/polls/${pollId}/vote`, {
          user_id:        userId,
          new_option_text:newOptionText,
        });
  
        /* replace the temporary id with the real one the server returns */
        const realId   = data.optionId;
        const replaceTemp = list =>
          list.map(post => {
            if (post.id !== postId || !post.poll) return post;
            const fixed = post.poll.options.map(opt =>
              opt.id === 'temp' ? { ...opt, id: realId } : opt
            );
            return { ...post, poll: { ...post.poll, options: fixed } };
          });
        setPosts(replaceTemp);
        setLatestPosts(replaceTemp);
  
        setPollSyncErrors(prev => {
          const m = new Map(prev);
          m.delete(pollId);
          return m;
        });
      } catch (err) {
        /* rollback on failure (optional—remove if you prefer to leave UI as‑is) */
        console.error(err);
        setPollSyncErrors(prev =>
          new Map(prev).set(pollId, 'Custom option sync failed')
        );
      } finally {
        setSyncingPolls(prev => {
          const s = new Set(prev);
          s.delete(pollId);
          return s;
        });
      }
    },
    [localUser]
  );

  return (
    <PollContext.Provider
      value={{
        syncingPolls,
        pollSyncErrors,
        handleVote,
        handleCustomVote,
        pollsLoading,
        pollsEnriched,
        /* expose nothing else – posts now live in PostContext */
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export default PollContext;
