import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface CommentFormProps {
  postId: number;
  socket: Socket;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, socket }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      socket.emit('create-comment', { postId, comment });
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