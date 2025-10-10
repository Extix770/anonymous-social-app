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
      {/* Reactions removed */}
    </div>
  );
};

export default Reaction;
