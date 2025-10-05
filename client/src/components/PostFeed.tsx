import React from 'react';

interface Post {
  id: number;
  content: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: string;
}

interface PostFeedProps {
  posts: Post[];
}

const PostFeed: React.FC<PostFeedProps> = ({ posts }) => {
  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="card mb-3">
          <div className="card-body">
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
            <p className="card-text">{post.content}</p>
            <p className="card-text">
              <small className="text-muted">
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