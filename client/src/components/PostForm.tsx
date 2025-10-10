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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setIsSubmitting(true);
    let mediaUrl = null;
    let mediaType = null;

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
            socket.emit('create-post', { content, mediaUrl, mediaType });

      // 3. Reset form
      setContent('');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

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

          {previewUrl && (
            <div className="mb-3">
              <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            </div>
          )}

          <div className="mb-3">
            <input type="file" className="form-control" onChange={handleFileChange} accept="image/*,video/*" />
          </div>

          <button type="submit" className="btn btn-success" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostForm;
