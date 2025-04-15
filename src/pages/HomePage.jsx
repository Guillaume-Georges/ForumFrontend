// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import MainFeed from '../components/MainFeed';
import LatestPosts from '../components/LatestPosts';
import api from '../api';

function HomePage({ localUser }) {
  const [posts, setPosts] = useState([]);
  const [syncingPolls, setSyncingPolls] = useState(new Set());
  const [pollSyncErrors, setPollSyncErrors] = useState(new Map());



  const addSyncingPoll = (pollId) => {
    setSyncingPolls(prev => new Set(prev).add(pollId));
  };
  
  const removeSyncingPoll = (pollId) => {
    setSyncingPolls(prev => {
      const updated = new Set(prev);
      updated.delete(pollId);
      return updated;
    });
  };

  const setPollError = (pollId, message) => {
    setPollSyncErrors(prev => {
      const updated = new Map(prev);
      updated.set(pollId, message);
      return updated;
    });
  
    // Automatically clear the error after 2 seconds
    setTimeout(() => {
      setPollSyncErrors(prev => {
        const updated = new Map(prev);
        updated.delete(pollId);
        return updated;
      });
    }, 2000);
  };
  
  const clearPollError = (pollId) => {
    setPollSyncErrors(prev => {
      const updated = new Map(prev);
      updated.delete(pollId);
      return updated;
    });
  };
  
  const isSyncing = (pollId) => syncingPolls.has(pollId);
  

  useEffect(() => {
    async function fetchPostsAndVotes() {
      try {
        const res = await api.get('/posts/get');
        const fetchedPosts = res.data;

        const pollIds = fetchedPosts
          .filter(p => p.poll?.id)
          .map(p => p.poll.id);

        if (pollIds.length === 0) {
          setPosts(fetchedPosts);
          return;
        }

        const voteRes = await api.post('/polls/votes/all', {
          poll_ids: pollIds,
        });

        const votes = voteRes.data;

        const enrichedPosts = fetchedPosts.map(post => {
          if (!post.poll) return post;

          const updatedOptions = post.poll.options.map(opt => {
            const voters = votes.filter(
              v => v.poll_id === post.poll.id && v.option_id === opt.id
            );

            return {
              ...opt,
              voters,
              user_voted: localUser ? voters.some(v => v.user_id === localUser.id) : false,
            };
          });

          return {
            ...post,
            poll: {
              ...post.poll,
              options: updatedOptions,
            },
          };
        });

        setPosts(enrichedPosts);
      } catch (err) {
        console.error('Failed to load posts/votes:', err);
      }
    }

    fetchPostsAndVotes();
  }, [localUser]); // Refresh if login changes


  const handleVote = async (postId, pollId, optionId, userId) => {

    if (isSyncing(pollId)) {
      console.warn(`Poll ${pollId} is syncing, vote blocked.`);
      return;
    }
  
    addSyncingPoll(pollId);

    if (optionId === null) {
      // UNVOTE optimistically
      setPosts(prev =>
        prev.map(post => {
          if (post.id !== postId || !post.poll) return post;
  
          const updatedOptions = post.poll.options
          .map(opt => {
            const voters = opt.voters?.filter(v => v.user_id !== userId) || [];
            const newVoteCount = Math.max(opt.vote_count - (opt.user_voted ? 1 : 0), 0);

            return {
              ...opt,
              vote_count: newVoteCount,
              user_voted: false,
              voters
            };
          })
          .filter(opt => {
            // Remove additional options with zero votes
            return !(opt.additional_option && opt.vote_count === 0);
          });
  
          return {
            ...post,
            poll: {
              ...post.poll,
              options: updatedOptions
            }
          };
        })
      );
  
      // Sync with backend (in background)
      try {
        await api.delete(`/polls/${pollId}/vote`, {
          data: { user_id: userId }
        });
        clearPollError(pollId);
  
      } catch (err) {
        console.error('Failed to unvote:', err);
        setPollError(pollId, 'Something went wrong. Please try again.');
      } finally {
        removeSyncingPoll(pollId);
      }
  
      return;
    }
  
    // VOTE optimistically
    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId || !post.poll) return post;
  
        const updatedOptions = post.poll.options.map(opt => {
          const isVotedFor = opt.id === optionId;
  
          const voters = opt.voters?.filter(v => v.user_id !== userId) || [];
          const newVoters = isVotedFor
            ? [...voters, {
                user_id: userId,
                user_name: localUser.name,
                profile_image: localUser.profile_image
              }]
            : voters;
  
          return {
            ...opt,
            vote_count: isVotedFor ? opt.vote_count + 1 : opt.vote_count,
            user_voted: isVotedFor,
            voters: newVoters
          };
        });
  
        return {
          ...post,
          poll: {
            ...post.poll,
            options: updatedOptions
          }
        };
      })
    );
  
    // Sync with backend
    try {
      await api.post(`/polls/${pollId}/vote`, {
        user_id: userId,
        option_id: optionId
      });
      clearPollError(pollId);
  
    } catch (err) {
      console.error('Failed to vote:', err);
      setPollError(pollId, 'Something went wrong. Please try again.');
    } finally {
      removeSyncingPoll(pollId);
    }
  };
  
  
  
  
  const handleCustomVote = async (postId, pollId, userId, newOptionText) => {
    try {
      const response = await api.post(`/polls/${pollId}/vote`, {
        user_id: userId,
        new_option_text: newOptionText
      });
  
      const newOptionId = response.data.optionId;
  
      setPosts(prev =>
        prev.map(post => {
          if (post.id !== postId || !post.poll) return post;
  
          // Reset all options to remove previous vote
          const resetOptions = post.poll.options
        .map(opt => ({
          ...opt,
          user_voted: false,
          voters: opt.voters?.filter(v => v.user_id !== userId) || [],
          vote_count: opt.user_voted ? opt.vote_count - 1 : opt.vote_count
        }))
        .filter(opt => !(opt.additional_option && opt.vote_count === 0));

  
          const newOption = {
            id: newOptionId,
            text: newOptionText,
            vote_count: 1,
            user_voted: true,
            additional_option: true,
            voters: [{
              user_id: userId,
              user_name: localUser.name,
              profile_image: localUser.profile_image
            }]
          };
  
          return {
            ...post,
            poll: {
              ...post.poll,
              options: [...resetOptions, newOption]
            }
          };
        })
      );
    } catch (err) {
      console.error('Failed to vote with custom option:', err);
      alert('Could not add new option. Try again.');
    }
  };
  
  

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));
  };

  const latest = posts.slice(0, 5);

  return (
    <div className="layout">
      <div className="feed">
        <MainFeed
          posts={posts}
          onVote={handleVote}
          onCustomVote={handleCustomVote} 
          onPostDeleted={handlePostDeleted}
          userId={localUser?.id || 0}
          localUser={localUser}
          syncingPolls={syncingPolls}
        pollSyncErrors={pollSyncErrors}
        />
      </div>
      <div className="sidebar">
        <LatestPosts
          posts={latest}
          onVote={handleVote}
          onCustomVote={handleCustomVote}
          onPostDeleted={handlePostDeleted}
          userId={localUser?.id || 0}
          localUser={localUser}
          syncingPolls={syncingPolls}
          pollSyncErrors={pollSyncErrors}
        />
      </div>
    </div>
  );
}

export default HomePage;
