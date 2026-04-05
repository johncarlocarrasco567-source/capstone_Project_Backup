// src/components/common/Header.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout } from '../../services/api';
import { removeToken, removeUser, getUser } from '../../utils/auth';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = async () => {
    try {
      await logout();
      removeToken();
      removeUser();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      removeToken();
      removeUser();
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h3>Welcome back, {user?.name}!</h3>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;