import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Comment from './Comment';
import Vote from './Vote';
import CommentForm from './CommentForm';
import Poll from './Poll';
import { Socket } from 'socket.io-client';

interface CommentData {
  id: number;
  text: string;
  timestamp: string;
  username: string;
  userId: string;
}

interface Post {
  id: number;
  content: string;
  timestamp: string;
  username: string;
  userId: string;
  category: string;
  mediaUrl?: string;
  mediaType?: string;
  comments: CommentData[];
  upvotes: number;
  downvotes: number;
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
  };
}

interface PostFeedProps {
  posts: Post[];
  socket: Socket;
}

const PostFeed: React.FC<PostFeedProps> = ({ posts, socket }) => {
  useEffect(() => {
    socket.on('poll-voted', ({ postId, poll }) => {
      (document as any).dispatchEvent(new CustomEvent('poll-voted', { detail: { postId, poll } }));
    });

    socket.on('post-voted', ({ postId, upvotes, downvotes }) => {
      (document as any).dispatchEvent(new CustomEvent('post-voted', { detail: { postId, upvotes, downvotes } }));
    });

    return () => {
      socket.off('poll-voted');
      socket.off('post-voted');
    };
  }, [socket]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
      {posts.map((post) => (
        <div key={post.id} className="card h-100">
          <div className="card-header">Category: {post.category}</div>
          <div className="card-body d-flex flex-column">
            {post.mediaUrl && (
              <div className="mb-3">
                {post.mediaType === 'image' && (
                  <img src={post.mediaUrl} alt="Post media" style={{ maxWidth: '100%', borderRadius: '4px' }} />
                )}
                {post.mediaType === 'video' && (
                  <video src={post.mediaUrl} controls style={{ maxWidth: '100%', borderRadius: '4px' }} />
                )}
              </div>
            )}
            <p className="card-text flex-grow-1">{post.content}</p>
            {post.poll && <Poll postId={post.id} poll={post.poll} socket={socket} />}
            <p className="card-text">
              <small className="text-muted">
                Posted by <Link to={`/users/${post.userId}`} className="username">{post.username}</Link> on {new Date(post.timestamp).toLocaleString()}
              </small>
            </p>
            <div className="mt-3">
              <Vote postId={post.id} upvotes={post.upvotes} downvotes={post.downvotes} socket={socket} />
            </div>
            <div className="mt-3">
              <h6 className="card-subtitle mb-2 text-muted">Comments</h6>
              {(post.comments || []).map(comment => (
                <Comment key={comment.id} comment={comment} />
              ))}
            </div>
            <CommentForm postId={post.id} socket={socket} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostFeed;