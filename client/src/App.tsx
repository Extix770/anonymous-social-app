
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PostForm from './components/PostForm';
import PostFeed from './components/PostFeed';
import MediaChat from './components/MediaChat';

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
  const [chatMode, setChatMode] = useState<'none' | 'audio' | 'video'>('none');

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

  const handleLeaveChat = () => {
    setChatMode('none');
  };

  return (
    <div className="container mt-4 hacker-container">
      <header className="mb-4">
        <h1 className="text-center">Anonymous Social Feed</h1>
      </header>
      <main>
        {chatMode !== 'none' ? (
          <MediaChat mode={chatMode} onLeave={handleLeaveChat} />
        ) : (
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Join Global Chat</h5>
              <button className="btn btn-success me-2" onClick={() => setChatMode('audio')}>Join Voice Chat</button>
              <button className="btn btn-primary" onClick={() => setChatMode('video')}>Join Video Chat</button>
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
