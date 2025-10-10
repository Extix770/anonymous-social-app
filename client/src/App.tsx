import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import PostForm from './components/PostForm';
import PostFeed from './components/PostFeed';
import OmegleChat from './components/OmegleChat';
import StatsDisplay from './components/StatsDisplay';
import CyberSecurityNews from './components/CyberSecurityNews';
import CyberSecurityTools from './components/CyberSecurityTools';

import './HackerTheme.css';

interface Post {
  id: number;
  content: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: string;
  comments: Comment[];
  reactions: { [key: string]: number };
}

interface Comment {
  id: number;
  text: string;
  timestamp: string;
}

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

function App() {
  return (
    <Router>
      <div className="container mt-4 hacker-container">
        <header className="mb-4">
          <h1 className="text-center">Anonymous Social Feed</h1>
          <nav className="nav justify-content-center">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/cybersecurity-news">Cybersecurity News</Link>
            <Link className="nav-link" to="/cybersecurity-tools">Cybersecurity Tools</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cybersecurity-news" element={<CyberSecurityNews />} />
            <Route path="/cybersecurity-tools" element={<CyberSecurityTools />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
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

    const socket = io(apiUrl);

    socket.on('new-post', (newPost: Post) => {
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    });

    socket.on('new-comment', ({ postId, comment }) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, comments: [...post.comments, comment] }
            : post
        )
      );
    });

    socket.on('new-reaction', ({ postId, reactions }) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, reactions } : post
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchPosts]);

  return (
    <>
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
    </>
  );
}

export default App;