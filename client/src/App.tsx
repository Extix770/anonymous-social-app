import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PostForm from './components/PostForm';
import PostFeed from './components/PostFeed';

interface Post {
  id: number;
  content: string;
  timestamp: string;
}

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);

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
    <div className="container mt-4" style={{ backgroundColor: '#f0f2f5', padding: '20px' }}>
      <header className="mb-4">
        <h1 className="text-center">Anonymous Social Feed</h1>
      </header>
      <main>
        <PostForm onNewPost={fetchPosts} />
        <PostFeed posts={posts} />
      </main>
    </div>
  );
}

export default App;