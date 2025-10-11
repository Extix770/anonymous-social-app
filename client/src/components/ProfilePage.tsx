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
      <div className="card-body text-center">
        <img src={user.avatar} alt={user.username} className="rounded-circle mb-3" width="150" height="150" />
        <h5 className="card-title">{user.username}</h5>
        <p className="card-text text-muted">{user.bio}</p>
        <div className="d-grid gap-2 col-6 mx-auto">
          <Link to={`/messages/${user.id}`} className="btn btn-primary">Message</Link>
          <Link to={`/users/${user.id}/edit`} className="btn btn-outline-secondary">Edit Profile</Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
