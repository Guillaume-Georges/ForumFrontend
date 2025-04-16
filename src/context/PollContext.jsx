import React, { createContext, useState, useCallback, useEffect } from 'react';
import api from '../api';

const PollContext = createContext();

export const PollProvider = ({ localUser, children }) => {
  const [posts, setPosts] = useState([]);
  const [syncingPolls, setSyncingPolls] = useState(new Set());
  const [pollSyncErrors, setPollSyncErrors] = useState(new Map());

  useEffect(() => {
    async function fetchPostsAndVotes() {
      try {
        const res = await api.get('/posts/get');
        const fetchedPosts = res.data;

        const pollIds = fetchedPosts.filter(p => p.poll?.id).map(p => p.poll.id);
        if (pollIds.length === 0) {
          setPosts(fetchedPosts);
          return;
        }

        const voteRes = await api.post('/polls/votes/all', { poll_ids: pollIds });
        const votes = voteRes.data;

        const enrichedPosts = fetchedPosts.map(post => {
          if (!post.poll) return post;
          const updatedOptions = post.poll.options.map(opt => ({
            ...opt,
            voters: votes.filter(v => v.poll_id === post.poll.id && v.option_id === opt.id),
            user_voted: localUser ? votes.some(v => v.user_id === localUser.id && v.option_id === opt.id) : false,
          }));
          return { ...post, poll: { ...post.poll, options: updatedOptions } };
        });

        setPosts(enrichedPosts);
      } catch (err) {
        console.error('Failed to load posts/votes:', err);
      }
    }

    fetchPostsAndVotes();
  }, [localUser]);

  const handleVote = useCallback(async (postId, pollId, optionId, userId) => {
    setSyncingPolls(prev => new Set(prev).add(pollId));

    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId || !post.poll) return post;

        const updatedOptions = post.poll.options.map(opt => {
          const voters = opt.voters.filter(v => v.user_id !== userId);

          if (optionId === null) { // Unvote
            return {
              ...opt,
              voters,
              user_voted: false,
              vote_count: opt.user_voted ? opt.vote_count - 1 : opt.vote_count,
            };
          }

          if (opt.id === optionId) {
            return {
              ...opt,
              voters: [...voters, {
                user_id: userId,
                user_name: localUser.name,
                profile_image: localUser.profile_image
              }],
              user_voted: true,
              vote_count: opt.vote_count + 1,
            };
          }

          return { ...opt, voters, user_voted: false };
        }).filter(opt => !(opt.additional_option && opt.vote_count === 0));

        return { ...post, poll: { ...post.poll, options: updatedOptions } };
      })
    );

    try {
      if (optionId === null) {
        await api.delete(`/polls/${pollId}/vote`, { data: { user_id: userId } });
      } else {
        await api.post(`/polls/${pollId}/vote`, { user_id: userId, option_id: optionId });
      }
      setPollSyncErrors(prev => {
        const updated = new Map(prev);
        updated.delete(pollId);
        return updated;
      });
    } catch (err) {
      setPollSyncErrors(prev => new Map(prev).set(pollId, 'Vote sync failed'));
      console.error(err);
    } finally {
      setSyncingPolls(prev => {
        const updated = new Set(prev);
        updated.delete(pollId);
        return updated;
      });
    }
  }, [localUser]);

  const handleCustomVote = useCallback(async (postId, pollId, userId, newOptionText) => {
    setSyncingPolls(prev => new Set(prev).add(pollId));

    try {
      const response = await api.post(`/polls/${pollId}/vote`, { user_id: userId, new_option_text: newOptionText });
      const newOptionId = response.data.optionId;

      setPosts(prev => prev.map(post => {
        if (post.id !== postId || !post.poll) return post;

        const resetOptions = post.poll.options.map(opt => ({
          ...opt,
          voters: opt.voters.filter(v => v.user_id !== userId),
          user_voted: false,
          vote_count: opt.user_voted ? opt.vote_count - 1 : opt.vote_count
        })).filter(opt => !(opt.additional_option && opt.vote_count === 0));

        const newOption = {
          id: newOptionId,
          text: newOptionText,
          vote_count: 1,
          user_voted: true,
          additional_option: true,
          voters: [{ user_id: userId, user_name: localUser.name, profile_image: localUser.profile_image }]
        };

        return { ...post, poll: { ...post.poll, options: [...resetOptions, newOption] } };
      }));

      setPollSyncErrors(prev => {
        const updated = new Map(prev);
        updated.delete(pollId);
        return updated;
      });
    } catch (err) {
      setPollSyncErrors(prev => new Map(prev).set(pollId, 'Custom option sync failed'));
      console.error(err);
    } finally {
      setSyncingPolls(prev => {
        const updated = new Set(prev);
        updated.delete(pollId);
        return updated;
      });
    }
  }, [localUser]);

  return (
    <PollContext.Provider value={{ posts, setPosts, syncingPolls, pollSyncErrors, handleVote, handleCustomVote }}>
      {children}
    </PollContext.Provider>
  );
};

export default PollContext;
