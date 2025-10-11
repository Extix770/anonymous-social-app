import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import PostForm from './components/PostForm';
import PostFeed from './components/PostFeed';
import OmegleChat from './components/OmegleChat';
import StatsDisplay from './components/StatsDisplay';
import CyberSecurityNews from './components/CyberSecurityNews';
import CyberSecurityTools from './components/CyberSecurityTools';
import ProfilePage from './components/ProfilePage';
import EditProfilePage from './components/EditProfilePage';
import PrivateMessagePage from './components/PrivateMessagePage';
import NotificationsPage from './components/NotificationsPage';
import SearchResultsPage from './components/SearchResultsPage';

import './HackerTheme.css';

interface Post {
  id: number;
  content: string;
  timestamp: string;
  username: string;
  userId: string;
  mediaUrl?: string;
  mediaType?: string;
  comments: Comment[];
  reactions: { [key: string]: number };
}

interface Comment {
  id: number;
  text: string;
  timestamp: string;
  username: string;
  userId: string;
}

interface User {
  id: string;
  username: string;
  bio: string;
  avatar: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  postId: number;
  fromUser: string;
  read: boolean;
}

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const newSocket = io(apiUrl, { query: { userId } });
    setSocket(newSocket);

    newSocket.on('user-created', (newUser: User) => {
      localStorage.setItem('userId', newUser.id);
      setUser(newUser);
    });

    newSocket.on('new-notification', () => {
      setUnreadNotifications(prev => prev + 1);
    });

    newSocket.on('notifications', (notifications: Notification[]) => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadNotifications(unread);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="container mt-4 hacker-container">
        <header className="mb-4">
          <h1 className="text-center">Anonymous Social Feed</h1>
          <nav className="nav justify-content-center">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/cybersecurity-news">Cybersecurity News</Link>
            <Link className="nav-link" to="/cybersecurity-tools">Cybersecurity Tools</Link>
            {user && <Link className="nav-link" to={`/users/${user.id}`}>My Profile</Link>}
            {user && (
              <Link className="nav-link" to="/notifications">
                Notifications {unreadNotifications > 0 && <span className="badge bg-danger">{unreadNotifications}</span>}
              </Link>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home socket={socket} user={user} />} />
            <Route path="/cybersecurity-news" element={<CyberSecurityNews />} />
            <Route path="/cybersecurity-tools" element={<CyberSecurityTools />} />
            <Route path="/users/:userId" element={<ProfilePage />} />
            <Route path="/users/:userId/edit" element={<EditProfilePage />} />
            <Route path="/messages/:userId" element={<PrivateMessagePage socket={socket} user={user} />} />
            <Route path="/notifications" element={<NotificationsPage socket={socket} />} />
            <Route path="/search" element={<SearchResultsPage socket={socket} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

interface HomeProps {
  socket: Socket | null;
  user: User | null;
}

function Home({ socket, user }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    try {
      const url = selectedCategory === 'All' ? `${apiUrl}/posts` : `${apiUrl}/posts?category=${selectedCategory}`;
      const response = await axios.get(url);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!socket) return;

    fetchPosts();

    const handlePollVoted = (e: any) => {
      const { postId, poll } = e.detail;
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, poll } : post
        )
      );
    };

    const handlePostVoted = (e: any) => {
      const { postId, upvotes, downvotes } = e.detail;
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, upvotes, downvotes } : post
        )
      );
    };

    (document as any).addEventListener('poll-voted', handlePollVoted);
    (document as any).addEventListener('post-voted', handlePostVoted);

    socket.on('new-post', (newPost: Post) => {
      if (selectedCategory === 'All' || newPost.category === selectedCategory) {
        setPosts((prevPosts) => [newPost, ...prevPosts]);
      }
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

    return () => {
      (document as any).removeEventListener('poll-voted', handlePollVoted);
      (document as any).removeEventListener('post-voted', handlePostVoted);
      socket.off('new-post');
      socket.off('new-comment');
    };
  }, [fetchPosts, socket, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  return (
    <>
      <StatsDisplay />
      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">Search</button>
            </div>
          </form>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <label htmlFor="category-filter" className="form-label">Filter by Category</label>
          <select
            id="category-filter"
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All</option>
            <option value="General">General</option>
            <option value="Tech">Tech</option>
            <option value="News">News</option>
            <option value="Funny">Funny</option>
          </select>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body text-center">
          <h5 className="card-title">You are: {user?.username || 'Anonymous'}</h5>
          {user && <Link to={`/users/${user.id}/edit`} className="btn btn-sm btn-outline-primary">Edit Profile</Link>}
        </div>
      </div>
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
      {socket && <PostForm socket={socket} />}
      {socket && <PostFeed posts={posts} socket={socket} />}
    </>
  );
}

export default App;
