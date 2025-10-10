import React from 'react';
import axios from 'axios';

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

interface ReactionProps {
  postId: number;
  reactions: { [key: string]: number };
}

const Reaction: React.FC<ReactionProps> = ({ postId, reactions }) => {
  const handleReaction = async (emoji: string) => {
    try {
      await axios.post(`${apiUrl}/posts/${postId}/react`, { emoji });
    } catch (error) {
      console.error('Error submitting reaction:', error);
    }
  };

  return (
    <div>
      {['👍', '❤️', '😂', '😮', '😢', '😠'].map(emoji => (
        <button key={emoji} className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleReaction(emoji)}>
          {emoji} {reactions[emoji] || 0}
        </button>
      ))}
    </div>
  );
};

export default Reaction;
