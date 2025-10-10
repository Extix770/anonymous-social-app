import React from 'react';

interface CommentProps {
  comment: {
    id: number;
    text: string;
    timestamp: string;
    username: string;
  };
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  return (
    <div className="card-text border-top pt-2 mt-2">
      <p>{comment.text}</p>
      <small className="text-muted">
        Posted by {comment.username} on {new Date(comment.timestamp).toLocaleString()}
      </small>
    </div>
  );
};

export default Comment;