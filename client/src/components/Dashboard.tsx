import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">Dashboard</div>
      <div className="list-group list-group-flush">
        <Link to="/cybersecurity-news" className="list-group-item list-group-item-action">Cybersecurity News</Link>
        <Link to="/cybersecurity-tools" className="list-group-item list-group-item-action">Cybersecurity Tools</Link>
        <Link to="/online" className="list-group-item list-group-item-action">Online</Link>
        <Link to={`/users/${localStorage.getItem('userId')}`} className="list-group-item list-group-item-action">My Profile</Link>
      </div>
    </div>
  );
};

export default Dashboard;
