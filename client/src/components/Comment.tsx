import React from 'react';

interface CommentProps {
  comment: {
    id: number;
    text: string;
    timestamp: string;
  };
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  return (
    <div className="card-text">
      <p>{comment.text}</p>
      <small className="text-muted">
        {new Date(comment.timestamp).toLocaleString()}
      </small>
    </div>
  );
};

export default Comment;
