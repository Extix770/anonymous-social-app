import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';

interface Message {
  from: string;
  fromUsername: string;
  text: string;
  timestamp: string;
}

interface RoomProps {
  user: any; // User object from App.tsx
}

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

const Room: React.FC<RoomProps> = ({ user }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [chatRoomSocket, setChatRoomSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !roomId) return;

    const newSocket = io(`${apiUrl}/chat-rooms`, { query: { userId: user.id } });
    setChatRoomSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`Connected to room ${roomId}`);
      newSocket.emit('join-room', { roomId });
    });

    newSocket.on('new-room-message', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on('member-joined', ({ username }: { username: string }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: 'system', fromUsername: 'System', text: `${username} has joined the room.`, timestamp: new Date().toISOString() },
      ]);
    });

    newSocket.on('member-left', ({ username }: { username: string }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: 'system', fromUsername: 'System', text: `${username} has left the room.`, timestamp: new Date().toISOString() },
      ]);
    });

    newSocket.on('room-full-or-error', ({ message }: { message: string }) => {
      alert(message);
      navigate('/chat-rooms');
    });

    return () => {
      newSocket.emit('leave-room', { roomId });
      newSocket.disconnect();
    };
  }, [user, roomId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (chatRoomSocket && newMessage.trim() && roomId) {
      chatRoomSocket.emit('room-message', { roomId, text: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div className="hacker-theme">
      <div className="page-content">
        <h2>Room: {roomId}</h2>
        <div className="chat-window card">
          <div className="card-body chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.from === user.id ? 'my-message' : ''}`}>
                <span className="username">{message.fromUsername}:</span> {message.text}
                <div className="timestamp">{new Date(message.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="card-footer chat-input">
            <input
              type="text"
              className="form-control"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <button className="btn btn-primary ml-2" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;