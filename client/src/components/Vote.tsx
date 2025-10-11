import React from 'react';
import { Socket } from 'socket.io-client';

interface VoteProps {
  postId: number;
  upvotes: number;
  downvotes: number;
  socket: Socket;
}

const Vote: React.FC<VoteProps> = ({ postId, upvotes, downvotes, socket }) => {
  const handleUpvote = () => {
    socket.emit('upvote-post', { postId });
  };

  const handleDownvote = () => {
    socket.emit('downvote-post', { postId });
  };

  return (
    <div className="d-flex align-items-center">
      <button className="btn btn-sm btn-outline-success me-2" onClick={handleUpvote}>Upvote</button>
      <span>{upvotes - downvotes}</span>
      <button className="btn btn-sm btn-outline-danger ms-2" onClick={handleDownvote}>Downvote</button>
    </div>
  );
};

export default Vote;
