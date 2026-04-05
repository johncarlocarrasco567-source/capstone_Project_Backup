// src/components/common/Layout.tsx

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  userRole: string;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole }) => {
  return (
    <div className="layout">
      <Sidebar userRole={userRole} />
      <div className="main-content">
        <Header />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;