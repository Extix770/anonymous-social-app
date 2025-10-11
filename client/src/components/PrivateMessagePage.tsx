import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface Message {
  from: string;
  to: string;
  text: string;
  timestamp: string;
}

interface PrivateMessagePageProps {
  socket: Socket | null;
  user: { id: string; username: string } | null;
}

const PrivateMessagePage: React.FC<PrivateMessagePageProps> = ({ socket, user }) => {
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !userId) return;

    socket.emit('get-private-messages', { withUserId: userId });

    socket.on('private-messages', (history: Message[]) => {
      setMessages(history);
    });

    socket.on('private-message', (message: Message) => {
      console.log('Received private message:', message, user);
      if ((message.from === user?.id && message.to === userId) || (message.from === userId && message.to === user?.id)) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('private-messages');
      socket.off('private-message');
    };
  }, [socket, userId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket && userId) {
      socket.emit('private-message', { to: userId, text: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div className="card">
      <div className="card-header">Chat with {userId}</div>
      <div className="card-body" style={{ height: '400px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div key={index} className={`d-flex ${msg.from === user?.id ? 'justify-content-end' : 'justify-content-start'}`}>
            <div className={`card mb-2 ${msg.from === user?.id ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '75%' }}>
              <div className="card-body">
                <p className="card-text">{msg.text}</p>
                <small className="text-muted-white">{new Date(msg.timestamp).toLocaleTimeString()}</small>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="card-footer">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="btn btn-primary" onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default PrivateMessagePage;
