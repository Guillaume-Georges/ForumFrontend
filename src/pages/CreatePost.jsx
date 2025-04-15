//frontend\src\pages\CreatePost.jsx

import React, { useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

function CreatePost({ localUser }) {

  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [allowNewOptions, setAllowNewOptions] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Move this after all useState/useEffect calls
  if (!localUser) {
    return <div style={{ padding: '1rem', textAlign: 'center' }}>Please log in to create a post.</div>;
  }

  // Use the localUser.id instead of a hardcoded user ID
  const userId = localUser.id  


  // Handle poll option text changes
  const handlePollOptionChange = (index, value) => {
    const updated = [...pollOptions]
    updated[index] = value
    setPollOptions(updated)
  }

  // Add a new option input
  const handleAddOption = () => {
    setPollOptions([...pollOptions, ''])
  }

  // Remove an option
  const handleRemoveOption = (index) => {
    const updated = [...pollOptions]
    updated.splice(index, 1)
    setPollOptions(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1) CREATE THE POST
      if (!title.trim()) {
        throw new Error('Title is required')
      }
      const postRes = await api.post('/posts/create', {
        user_id: userId,  // Uses the real DB user ID from Auth0 via localUser
        title,
        description
      })
      const { postId } = postRes.data
      if (!postId) {
        throw new Error('Failed to create post')
      }

      // 2) UPLOAD IMAGE (if selected)
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        // Note: Ensure the URL string is correctly formed (use backticks)
        await api.post(`/media/upload?post_id=${postId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      // 3) CREATE A POLL (if question is provided)
      const hasPoll = pollQuestion.trim().length > 0
      if (hasPoll) {
        const validOptions = pollOptions.filter(o => o.trim().length > 0)
        if (validOptions.length < 2) {
          throw new Error('Poll must have at least 2 valid options')
        }
        await api.post('/polls/create', {
          post_id: postId,
          question: pollQuestion,
          options: validOptions,
          allowNewOptions
        })
      }

      alert('Post created successfully!')
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Create a New Post</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Title:</label>
          <input
            style={{ display: 'block', width: '100%' }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Description:</label>
          <textarea
            style={{ display: 'block', width: '100%' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Image upload */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Image (optional):</label>
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            accept="image/*"
          />
        </div>

        {/* Poll question */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Poll Question (optional):</label>
          <input
            style={{ display: 'block', width: '100%' }}
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            placeholder="Leave empty if no poll"
          />
        </div>

        {/* Poll options */}
        {pollQuestion.trim() && (
          <div style={{ marginBottom: '1rem', background: '#f9f9f9', padding: '0.5rem' }}>
            <p>Poll Options:</p>
            {pollOptions.map((opt, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <input
                  style={{ width: '80%' }}
                  value={opt}
                  onChange={e => handlePollOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button type="button" onClick={() => handleRemoveOption(idx)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddOption}>Add Option</button>

            <div style={{ marginTop: '0.5rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={allowNewOptions}
                  onChange={e => setAllowNewOptions(e.target.checked)}
                />
                Allow users to add new options
              </label>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  )
}

export default CreatePost
