import React from 'react';
import { Link } from 'react-router-dom';

interface CommentProps {
  comment: {
    id: number;
    text: string;
    timestamp: string;
    username: string;
    userId: string;
  };
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  return (
    <div className="card-text border-top pt-2 mt-2">
      <p>{comment.text}</p>
      <small className="text-muted">
        Posted by <Link to={`/users/${comment.userId}`} className="username">{comment.username}</Link> on {new Date(comment.timestamp).toLocaleString()}
      </small>
    </div>
  );
};

export default Comment;