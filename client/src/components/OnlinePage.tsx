import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface OnlineUser {
  id: string;
  username: string;
}

interface OnlinePageProps {
  socket: Socket | null;
}

const OnlinePage: React.FC<OnlinePageProps> = ({ socket }) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get-online-users');

    socket.on('online-users', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('online-users');
    };
  }, [socket]);

  return (
    <div className="card">
      <div className="card-header">Online Users</div>
      <div className="list-group list-group-flush">
        {onlineUsers.map((user) => (
          <Link
            key={user.id}
            to={`/messages/${user.id}`}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          >
            {user.username}
            <span className="badge bg-success rounded-pill">Online</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OnlinePage;
