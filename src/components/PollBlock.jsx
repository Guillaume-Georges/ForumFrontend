import React, { useState, useContext } from 'react';
import PersonImage from '../assets/PersonIcon.png';
import PollContext from '../context/PollContext';

function PollBlock({ poll, postId, userId }) {
  const { syncingPolls, pollSyncErrors, handleVote, handleCustomVote } = useContext(PollContext);
  const [customOptionText, setCustomOptionText] = useState('');

  const totalVotes = poll.options.reduce((sum, o) => sum + o.vote_count, 0);
  const votedOption = poll.options.find(opt => opt.user_voted);
  const hasVoted = Boolean(votedOption);
  const syncing = syncingPolls.has(poll.id);
  const error = pollSyncErrors.get(poll.id);

  const handleVoteClick = (optionId) => {
    if (userId === 0) {
      alert('Please log in to vote.');
      return;
    }

    if (syncing) return;

    if (optionId === votedOption?.id) {
      handleVote(postId, poll.id, null, userId);
    } else if (!hasVoted) {
      handleVote(postId, poll.id, optionId, userId);
    } else {
      alert('Unvote before voting again.');
    }
  };

  const handleCustomOptionVote = () => {
    if (!customOptionText.trim() || syncing) return;
    handleCustomVote(postId, poll.id, userId, customOptionText);
    setCustomOptionText('');
  };

  return (
    <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px' }}>
      <strong style={{ display: 'block', marginBottom: '0.75rem' }}>
        Poll: {poll.question}
      </strong>

      {poll.options.filter(option => !(option.additional_option && option.vote_count === 0)).map(option => {
        const barPercent = totalVotes === 0 ? 0 : (option.vote_count / totalVotes) * 100;
        const voters = option.voters?.slice(0, 5) || [];

        return (
          <div key={option.id} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 60 }}>{option.text}</span>
              <div style={{
                width: '60%',
                height: 12,
                background: '#e0a8a8',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${barPercent}%`,
                  height: '100%',
                  background: '#a00000',
                  borderRadius: 8,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                {voters.map((v, idx) => (
                  <img
                    key={idx}
                    src={v.profile_image || PersonImage}
                    alt={v.user_name}
                    title={v.user_name}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid white',
                      marginLeft: idx > 0 ? '-8px' : '0',
                      backgroundColor: '#fff'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PersonImage;
                    }}
                  />
                ))}
              </div>

              <span style={{ marginLeft: '0.5rem', minWidth: 20 }}>{option.vote_count}</span>

              {!hasVoted || option.id === votedOption?.id ? (
                <button
                  onClick={() => handleVoteClick(option.id)}
                  style={{
                    marginLeft: '1rem',
                    padding: '0.25rem 0.5rem',
                    background: option.user_voted ? '#66bb6a' : '#ddd',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={syncing}
                >
                  {option.user_voted ? 'Unvote' : 'Vote'}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {poll.allowNewOptions && !hasVoted && (
        <div style={{ marginTop: '0.5rem' }}>
          <input
            type="text"
            placeholder="Suggest another option"
            value={customOptionText}
            onChange={e => setCustomOptionText(e.target.value)}
            style={{
              marginRight: '0.5rem',
              padding: '0.25rem',
              width: '60%',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleCustomOptionVote}
            style={{
              padding: '0.25rem 0.75rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
            disabled={syncing}
          >
            Vote
          </button>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '0.75rem',
          color: 'red',
          fontSize: '0.875rem',
          background: '#ffeaea',
          border: '1px solid #f5c2c2',
          padding: '0.5rem',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default PollBlock;