import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';

interface Room {
  id: string;
  name: string;
  memberCount: number;
}

interface ChatRoomsProps {
  user: any; // User object from App.tsx
}

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

const ChatRooms: React.FC<ChatRoomsProps> = ({ user }) => {
  const [chatRoomSocket, setChatRoomSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(`${apiUrl}/chat-rooms`, { query: { userId: user.id } });
    setChatRoomSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat rooms namespace');
      newSocket.emit('get-rooms');
    });

    newSocket.on('rooms', (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    });

    newSocket.on('room-joined', ({ roomId }: { roomId: string }) => {
      navigate(`/chat-rooms/${roomId}`);
    });

    newSocket.on('room-full-or-error', ({ message }: { message: string }) => {
      alert(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, navigate]);

  const handleCreateRoom = () => {
    const trimmedRoomName = newRoomName.trim();
    if (chatRoomSocket && trimmedRoomName) {
      chatRoomSocket.emit('create-room', { roomName: trimmedRoomName });
      setNewRoomName('');
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (chatRoomSocket) {
      chatRoomSocket.emit('join-room', { roomId });
    }
  };

  return (
    <div className="hacker-theme">
      <div className="page-content">
        <h2>Chat Rooms</h2>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="New room name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <button className="btn btn-primary mt-2" onClick={handleCreateRoom}>
            Create Room
          </button>
        </div>

        <h3>Available Rooms</h3>
        {rooms.length === 0 ? (
          <p>No rooms available. Create one!</p>
        ) : (
          <ul className="list-group">
            {rooms.map((room) => (
              <li key={room.id} className="list-group-item d-flex justify-content-between align-items-center">
                {room.name} ({room.memberCount}/8)
                <button className="btn btn-sm btn-success" onClick={() => handleJoinRoom(room.id)}>
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatRooms;