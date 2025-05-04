//frontend\src\components\PollBlock.jsx 
import React, { useState, useContext, useEffect } from 'react';
import PersonImage from '../assets/PersonIcon.png';
import PollContext from '../context/PollContext';
import '../styles/pollBlock.css';

function PollBlock({ poll, postId, userId, guard }) {

  const { syncingPolls, pollSyncErrors, handleVote, handleCustomVote } = useContext(PollContext);
  const [customOptionText, setCustomOptionText] = useState('');

  const totalVotes = poll.options.reduce((sum, o) => sum + o.vote_count, 0);
  const votedOption = poll.options.find(opt => opt.user_voted);
  const hasVoted = Boolean(votedOption);
  const syncing = syncingPolls.has(poll.id);
  const error = pollSyncErrors.get(poll.id);

  const doVoteClick = (optionId) => {
        if (syncing) return;
    
        if (optionId === votedOption?.id) {
          handleVote(postId, poll.id, null, userId);
        } else if (!hasVoted) {
          handleVote(postId, poll.id, optionId, userId);
        } else {
          alert('Unvote before voting again.');
      }
      };
    
  const handleVoteClick = (optionId) => guard(() => doVoteClick(optionId));

  const doCustomVote = () => {
        if (!customOptionText.trim() || syncing) return;
        handleCustomVote(postId, poll.id, userId, customOptionText);
        setCustomOptionText('');
      };
    
  const handleCustomOptionVote = () => guard(doCustomVote);

  return (
    <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px' }}>
      <strong style={{ display: 'block', marginBottom: '0.75rem' }}>
        Poll: {poll.question}
      </strong>

      {poll.options
      .filter(o => !(o.additional_option && o.vote_count === 0))
      .map(option => {
        const barPercent = totalVotes === 0
          ? 0
          : (option.vote_count / totalVotes) * 100;
        const voters     = option.voters?.slice(0, 5) || [];

        return (
          <div key={option.id} style={{ marginBottom:'1rem' }}>
            <div className="poll-row">            {/* NEW wrapper class */}

              {/* option text */}
              <span style={{ width: 60 }}>{option.text}</span>

              {/* bar */}
              <div style={{
                width:'60%', height:12, background:'#e0a8a8',
                borderRadius:8, overflow:'hidden'
              }}>
                <div style={{
                  width:`${barPercent}%`, height:'100%',
                  background:'#a00000', borderRadius:8,
                  transition:'width .3s ease'
                }}/>
              </div>

              {/* avatars */}
              <div style={{ display:'flex', marginLeft:'.5rem' }}>
                {voters.map((v, i) => (
                  <img
                    key={i}
                    src={v.profile_image || PersonImage}
                    title={v.user_name}
                    alt={v.user_name}
                    onError={e => { e.target.src = PersonImage; }}
                    style={{
                      width:20, height:20, borderRadius:'50%',
                      objectFit:'cover', border:'1px solid #fff',
                      marginLeft: i ? '-8px' : 0, background:'#fff'
                    }}
                  />
                ))}
              </div>

              {/* vote-count */}
              <span style={{ marginLeft:'.5rem', minWidth:20 }}>
                {option.vote_count}
              </span>

              {/* vote / un-vote button */}
              {(!hasVoted || option.id === votedOption?.id) && (
                <button
                  className={
                    `poll-voteBtn${option.user_voted ? ' poll-voteBtn--on' : ''}`
                  }
                  style={{ marginLeft:'auto' }}   /* keep it right-aligned */
                  disabled={syncing}
                  onClick={() => handleVoteClick(option.id)}
                >
                  {option.user_voted ? 'Unvote' : 'Vote'}
                </button>
              )}
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
              background: '#ddd',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
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