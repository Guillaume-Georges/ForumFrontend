// frontend/src/pages/CreatePost.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import '../styles/createPost.css';

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
  const fileInputRef = useRef(null);

  const removeImage = () => {
    setFile(null);
    setPreviewUrl(null);
    // clear the native file input so a user can pick the same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  // Editor options for SimpleMDE (ensuring consistency with CommentSection)
  /* 1️⃣  Memoise the options so the reference never changes */
  const editorOptions = useMemo(() => ({
    placeholder: 'Enter post description here…',
      spellChecker: false,
      toolbar: [
        'bold', 'italic', 'strikethrough', '|',
        'heading', 'quote', 'code', '|',
        'unordered-list', 'ordered-list', '|',
        'link', '|',
        'undo', 'redo'
      ],
      status: false,
      /*  optional – makes the first focus automatic and
          also masks any brief unmount/mount jitter */
      autofocus: true
    }), []);

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

  
  const handleDescriptionChange = useCallback((val) => {
      setDescription(val);
    }, []);

  const handleRemoveOption = (index) => {
    const updated = [...pollOptions];
    updated.splice(index, 1);
    setPollOptions(updated);
  };

  // 🔐 stop unauthenticated users
  if (!localUser) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        Please log in to create a post.
      </div>
    );
  }

  /** 👉 add this line back */
  const userId = localUser.id;

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
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* CreatePost.jsx */
  return (
    <section className="cp‑wrap">
      <h2 className="cp‑title">Create a new post</h2>
      {error && <p className="cp‑error">{error}</p>}
  
      <form className="cp‑form" onSubmit={handleSubmit}>
        {/* Title */}
        <label className="cp‑label">
          Title
          <input
            className="cp‑input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </label>
  
        {/* Description */}
        <label htmlFor="description" className="cp-label">
          Description
        </label>
        <SimpleMDE
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          options={editorOptions}
        />
  
        {/* Image upload */}
        <label className="cp‑label">
          Image <span className="cp‑optional">(optional)</span>
          <input
            type="file"
            ref={fileInputRef}          //  ←  attach the ref
            onChange={handleFileChange}
            accept="image/*"
          />
        </label>
  
        {/* Preview block */}
        {previewUrl && (
          <div className="cp-previewWrap">
            <img className="cp-preview" src={previewUrl} alt="preview" />

            <button
              type="button"
              className="cp-removePreview"
              onClick={removeImage}
              title="Remove image"
            >
              &times;
            </button>
          </div>
        )}
  
        {/* Poll question */}
        <label className="cp‑label">
          Poll question <span className="cp‑optional">(optional)</span>
          <input
            className="cp‑input"
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            placeholder="Leave empty if no poll"
          />
        </label>
  
        {/* Poll options */}
        {pollQuestion.trim() && (
          <div className="cp‑pollBox">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="cp‑pollRow">
                <input
                  className="cp‑input"
                  value={opt}
                  onChange={e => handlePollOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    className="cp‑iconBtn"
                    onClick={() => handleRemoveOption(idx)}
                    title="Remove option"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
  
            <button
              type="button"
              className="cp‑ghost"
              onClick={handleAddOption}
            >
              + Add option
            </button>
  
            <label className="cp‑checkbox">
              <input
                type="checkbox"
                checked={allowNewOptions}
                onChange={e => setAllowNewOptions(e.target.checked)}
              />
              Allow users to add new options
            </label>
          </div>
        )}
  
        <button
          type="submit"
          className="cp‑submit"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create post'}
        </button>
      </form>
    </section>
  
  );
}
export default CreatePost;


