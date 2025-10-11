import React, { useState } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';

interface PostFormProps {
  socket: Socket;
}

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PostForm: React.FC<PostFormProps> = ({ socket }) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('General');
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile && !showPoll) return;

    setIsSubmitting(true);
    let mediaUrl = null;
    let mediaType = null;
    let poll = null;

    if (showPoll) {
      poll = {
        question: pollQuestion,
        options: pollOptions.map(option => ({ text: option, votes: 0 })),
      };
    }

    try {
      // 1. If a file is selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('media', selectedFile);

        const uploadRes = await axios.post(`${apiUrl}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        mediaUrl = uploadRes.data.url;
        mediaType = uploadRes.data.mediaType;
      }

      // 2. Create the post with the media URL via socket
            socket.emit('create-post', { content, mediaUrl, mediaType, category, poll });

      // 3. Reset form
      setContent('');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setShowPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);

    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Create a new post</h5>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <textarea
              className="form-control"
              rows={3}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>

          <div className="mb-3">
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Tech">Tech</option>
              <option value="News">News</option>
              <option value="Funny">Funny</option>
            </select>
          </div>

          {showPoll && (
            <div className="mb-3 border p-3">
              <div className="mb-3">
                <label htmlFor="poll-question" className="form-label">Poll Question</label>
                <input
                  type="text"
                  id="poll-question"
                  className="form-control"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
              </div>
              {pollOptions.map((option, index) => (
                <div className="input-group mb-2" key={index}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  />
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addPollOption}>Add Option</button>
            </div>
          )}

          {previewUrl && (
            <div className="mb-3">
              <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            </div>
          )}

          <div className="mb-3">
            <input type="file" className="form-control" onChange={handleFileChange} accept="image/*,video/*" />
          </div>

          <div className="d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPoll(!showPoll)}>
              {showPoll ? 'Remove Poll' : 'Add Poll'}
            </button>
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;
