import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface Notification {
  id: string;
  userId: string;
  type: string;
  postId: number;
  fromUser: string;
  read: boolean;
}

interface NotificationsPageProps {
  socket: Socket | null;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ socket }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get-notifications');

    socket.on('notifications', (userNotifications: Notification[]) => {
      setNotifications(userNotifications);
    });

    return () => {
      socket.off('notifications');
    };
  }, [socket]);

  const handleNotificationClick = (notification: Notification) => {
    if (!socket) return;
    socket.emit('mark-notification-as-read', { notificationId: notification.id });
  };

  return (
    <div className="card">
      <div className="card-header">Notifications</div>
      <div className="list-group list-group-flush">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            to={`/posts/${notification.postId}`}
            className={`list-group-item list-group-item-action ${notification.read ? '' : 'list-group-item-primary'}`}
            onClick={() => handleNotificationClick(notification)}
          >
            {notification.fromUser} commented on your post.
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
