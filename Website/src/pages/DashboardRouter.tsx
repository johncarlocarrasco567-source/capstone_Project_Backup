// src/pages/DashboardRouter.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getUserRole } from '../utils/auth';
import Layout from '../components/common/Layout';

// Super Admin Components
import SuperAdminDashboard from '../components/superadmin/Dashboard';
import BranchManagement from '../components/superadmin/BranchManagement';
import InventoryView from '../components/superadmin/InventoryView';
import SalesAnalytics from '../components/superadmin/SalesAnalytics';
import ReportReview from '../components/superadmin/ReportReview';

// Admin Components
import AdminDashboard from '../components/admin/Dashboard';
import ProductManagement from '../components/admin/ProductManagement';
import AdminInventory from '../components/admin/InventoryManagement';
import StaffManagement from '../components/admin/StaffManagement';
import OrderMonitoring from '../components/admin/OrderMonitoring';
import ReportSubmission from '../components/admin/ReportSubmission';
import CategoryManagement from '../components/admin/CategoryManagement';

const DashboardRouter: React.FC = () => {
  const userRole = getUserRole();

  if (userRole === 'Super Admin') {
    return (
      <Layout userRole="Super Admin">
        <Routes>
          <Route path="/" element={<Navigate to="/super-admin/dashboard" />} />
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/branches" element={<BranchManagement />} />
          <Route path="/super-admin/inventory" element={<InventoryView />} />
          <Route path="/super-admin/sales" element={<SalesAnalytics />} />
          <Route path="/super-admin/reports" element={<ReportReview />} />
        </Routes>
      </Layout>
    );
  }

  if (userRole === 'Admin') {
    return (
      <Layout userRole="Admin">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/staff" element={<StaffManagement />} />
          <Route path="/admin/orders" element={<OrderMonitoring />} />
          <Route path="/admin/reports" element={<ReportSubmission />} />
          
        </Routes>
      </Layout>
    );
  }

  return <Navigate to="/login" />;
};

export default DashboardRouter;