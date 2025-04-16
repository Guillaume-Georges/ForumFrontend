// frontend/src/pages/CreatePost.jsx

import React, { useState, useEffect } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'

function CreatePost({ localUser }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // Markdown content
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [allowNewOptions, setAllowNewOptions] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for a logged in user
  if (!localUser) {
    return <div style={{ padding: '1rem', textAlign: 'center' }}>Please log in to create a post.</div>;
  }
  const userId = localUser.id;

  // Editor options for SimpleMDE (ensuring consistency with CommentSection)
  const editorOptions = {
    placeholder: 'Enter post description here...',
    spellChecker: false,
    toolbar: [
      'bold', 'italic', 'strikethrough', '|',
      'heading', 'quote', 'code', '|',
      'unordered-list', 'ordered-list', '|',
      'link', '|',
      'undo', 'redo'
    ],
    status: false,
  };

  // --- Draft Saving Logic ---
  // Load saved draft data when the component mounts
  useEffect(() => {
    const savedDraft = localStorage.getItem('createPostDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setPollQuestion(draft.pollQuestion || '');
        setPollOptions(draft.pollOptions || ['', '']);
        setAllowNewOptions(draft.allowNewOptions || false);
      } catch (err) {
        console.error('Failed to parse draft', err);
      }
    }
  }, []);

  // Save draft data on each change to the form fields
  useEffect(() => {
    const draft = { title, description, pollQuestion, pollOptions, allowNewOptions };
    localStorage.setItem('createPostDraft', JSON.stringify(draft));
  }, [title, description, pollQuestion, pollOptions, allowNewOptions]);

  // --- Image Preview Logic ---
  // Handle file changes and create a preview URL
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  // Cleanup: revoke the object URL when the component unmounts or when a new file is selected
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // --- Poll Options Handlers ---
  const handlePollOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleAddOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemoveOption = (index) => {
    const updated = [...pollOptions];
    updated.splice(index, 1);
    setPollOptions(updated);
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      // 1) Create the post
      const postRes = await api.post('/posts/create', {
        user_id: userId,
        title,
        description
      });
      const { postId } = postRes.data;
      if (!postId) {
        throw new Error('Failed to create post');
      }

      // 2) Upload image if one is provided
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/media/upload?post_id=${postId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 3) Create a poll if a poll question is provided
      const hasPoll = pollQuestion.trim().length > 0;
      if (hasPoll) {
        const validOptions = pollOptions.filter(o => o.trim().length > 0);
        if (validOptions.length < 2) {
          throw new Error('Poll must have at least 2 valid options');
        }
        await api.post('/polls/create', {
          post_id: postId,
          question: pollQuestion,
          options: validOptions,
          allowNewOptions
        });
      }

      // Clear the draft after successful submission
      localStorage.removeItem('createPostDraft');

      alert('Post created successfully!');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Description using SimpleMDE */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Description:</label>
          <SimpleMDE
            value={description}
            onChange={setDescription}
            options={editorOptions}
          />
        </div>

        {/* Image Upload with Preview */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Image (optional):</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
          />
          {previewUrl && (
            <div style={{ marginTop: '1rem' }}>
              <p>Image Preview:</p>
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          )}
        </div>

        {/* Poll Question */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Poll Question (optional):</label>
          <input
            style={{ display: 'block', width: '100%' }}
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            placeholder="Leave empty if no poll"
          />
        </div>

        {/* Poll Options */}
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
  );
}

export default CreatePost;
