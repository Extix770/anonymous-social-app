
import React from 'react';

interface Post {
  id: number;
  content: string;
  timestamp: string;
}

interface PostFeedProps {
  posts: Post[];
}

const PostFeed: React.FC<PostFeedProps> = ({ posts }) => {
  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="card mb-3" style={{ border: '1px solid red' }}>
          <div className="card-body">
            <p className="card-text">{post.content}</p>
            <p className="card-text">
              <small className="text-muted" style={{ color: 'blue !important' }}>
                Posted on {new Date(post.timestamp).toLocaleString()}
              </small>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostFeed;
