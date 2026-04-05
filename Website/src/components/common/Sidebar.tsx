// src/components/common/Sidebar.tsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const getMenuItems = () => {
    if (userRole === 'Super Admin') {
      return [
        { path: '/super-admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/super-admin/branches', icon: '🏢', label: 'Branches' },
        { path: '/super-admin/inventory', icon: '📦', label: 'Inventory View' },
        { path: '/super-admin/sales', icon: '💰', label: 'Sales Analytics' },
        { path: '/super-admin/reports', icon: '📩', label: 'Reports Review' },
      ];
    } else if (userRole === 'Admin') {
  return [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/categories', icon: '🏷️', label: 'Categories' }, // Add this
    { path: '/admin/products', icon: '🛍️', label: 'Products' },
    { path: '/admin/inventory', icon: '📦', label: 'Inventory' },
    { path: '/admin/staff', icon: '👥', label: 'Staff' },
    { path: '/admin/orders', icon: '🧾', label: 'Orders' },
    { path: '/admin/reports', icon: '📩', label: 'Reports' },
  ];
}
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>POS System</h2>
        <p className="user-role">{userRole}</p>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;