import React, { useState } from 'react';
import axios from 'axios';

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

interface CommentFormProps {
  postId: number;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await axios.post(`${apiUrl}/posts/${postId}/comments`, { comment });
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Post</button>
      </div>
    </form>
  );
};

export default CommentForm;
