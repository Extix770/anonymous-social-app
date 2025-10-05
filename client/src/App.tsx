import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PostForm from './components/PostForm';
import PostFeed from './components/PostFeed';
import OmegleChat from './components/OmegleChat';
import StatsDisplay from './components/StatsDisplay';

import './HackerTheme.css';

interface Post {
  id: number;
  content: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: string;
}

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="container mt-4 hacker-container">
      <header className="mb-4">
        <h1 className="text-center">Anonymous Social Feed</h1>
      </header>
      <main>
        <StatsDisplay />
        {isChatting ? (
          <OmegleChat onLeave={() => setIsChatting(false)} />
        ) : (
          <div className="card mb-3">
            <div className="card-body text-center">
              <h5 className="card-title">Ready to Chat?</h5>
              <p>You will be randomly paired with a stranger for a one-on-one video chat.</p>
              <button className="btn btn-primary" onClick={() => setIsChatting(true)}>Start Chatting</button>
            </div>
          </div>
        )}
        <PostForm onNewPost={fetchPosts} />
        <PostFeed posts={posts} />
      </main>
    </div>
  );
}

export default App;