import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PostFeed from './PostFeed';
import { Socket } from 'socket.io-client';

interface Post {
  id: number;
  content: string;
  timestamp: string;
  username: string;
  userId: string;
  category: string;
  mediaUrl?: string;
  mediaType?: string;
  comments: any[];
  upvotes: number;
  downvotes: number;
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
  };
}

interface SearchResultsPageProps {
  socket: Socket | null;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ socket }) => {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const query = searchParams.get('q');

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const response = await axios.get(`/api/search?q=${query}`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    };

    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  return (
    <div>
      <h2>Search Results for "{query}"</h2>
      {socket && <PostFeed posts={posts} socket={socket} />}
    </div>
  );
};

export default SearchResultsPage;
