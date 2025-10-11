import React from 'react';
import { Socket } from 'socket.io-client';

interface PollOption {
  text: string;
  votes: number;
}

interface PollProps {
  postId: number;
  poll: {
    question: string;
    options: PollOption[];
  };
  socket: Socket;
}

const Poll: React.FC<PollProps> = ({ postId, poll, socket }) => {
  const totalVotes = poll.options.reduce((acc, option) => acc + option.votes, 0);

  const handleVote = (optionIndex: number) => {
    socket.emit('vote-on-poll', { postId, optionIndex });
  };

  return (
    <div className="card mt-3">
      <div className="card-body">
        <h5 className="card-title">{poll.question}</h5>
        {poll.options.map((option, index) => (
          <div key={index} className="mb-2">
            <button
              className="btn btn-outline-primary w-100 text-start"
              onClick={() => handleVote(index)}
            >
              {option.text}
            </button>
            <div className="progress mt-1">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }}
                aria-valuenow={totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {option.votes > 0 && `${Math.round((option.votes / totalVotes) * 100)}%`}
              </div>
            </div>
          </div>
        ))}
        <small className="text-muted">Total votes: {totalVotes}</small>
      </div>
    </div>
  );
};

export default Poll;
