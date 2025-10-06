import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

const StatsDisplay: React.FC = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the server just for stats
    const socket = io(apiUrl);
    socketRef.current = socket;

    socket.on('update-stats', ({ onlineCount, totalVisits }) => {
      setOnlineCount(onlineCount);
      setTotalVisits(totalVisits);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="card mb-3">
      <div className="card-body text-center">
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div>
            <h5>Online</h5>
            <p className="card-text">{onlineCount}</p>
          </div>
          <div>
            <h5>Total Visits</h5>
            <p className="card-text">{totalVisits}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;
