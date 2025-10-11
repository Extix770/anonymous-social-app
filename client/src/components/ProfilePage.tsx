import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  bio: string;
  avatar: string;
}

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [userId]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <img src={user.avatar} alt={user.username} className="rounded-circle me-3" width="100" height="100" />
          <div>
            <h5 className="card-title">{user.username}</h5>
            <p className="card-text">{user.bio}</p>
            <Link to={`/messages/${user.id}`} className="btn btn-primary">Message</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
