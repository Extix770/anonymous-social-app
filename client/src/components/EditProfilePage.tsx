import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  bio: string;
  avatar: string;
}

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

const EditProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [bio, setBio] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/users/${userId}`);
        setUser(response.data);
        setBio(response.data.bio);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSave = async () => {
    try {
      await axios.put(`${apiUrl}/api/users/${userId}`, { bio });
      navigate(`/users/${userId}`);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Edit Profile</h5>
        <div className="mb-3">
          <label htmlFor="bio" className="form-label">Bio</label>
          <textarea
            id="bio"
            className="form-control"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default EditProfilePage;
