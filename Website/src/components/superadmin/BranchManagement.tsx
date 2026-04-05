// src/components/superadmin/BranchManagement.tsx

import React, { useEffect, useState } from 'react';
import { getBranches, createBranch, updateBranch, deleteBranch, createAdmin } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './BranchManagement.css';

interface Branch {
  id: number;
  name: string;
  location: string;
  type: 'company' | 'franchise';
  users_count?: number;
  orders_count?: number;
  created_at: string;
}

interface BranchFormData {
  name: string;
  location: string;
  type: 'company' | 'franchise';
}

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    location: '',
    type: 'company'
  });
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchBranches();
  }, [filterType]);

  const fetchBranches = async () => {
    try {
      const params: { type?: string; per_page?: number } = {};
      if (filterType) params.type = filterType;
      params.per_page = 100;
      const response = await getBranches(params);
      setBranches(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, formData);
        toast.success('Branch updated successfully');
      } else {
        await createBranch(formData);
        toast.success('Branch created successfully');
      }
      setModalOpen(false);
      setEditingBranch(null);
      setFormData({ name: '', location: '', type: 'company' });
      fetchBranches();
    } catch (error) {
      toast.error('Failed to save branch');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this branch? This will also delete all associated data.')) {
      try {
        await deleteBranch(id);
        toast.success('Branch deleted successfully');
        fetchBranches();
      } catch (error) {
        toast.error('Failed to delete branch');
      }
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    
    try {
      await createAdmin(selectedBranch.id, adminData);
      toast.success('Admin created successfully');
      setAdminModalOpen(false);
      setAdminData({ name: '', email: '', password: '' });
      setSelectedBranch(null);
    } catch (error) {
      toast.error('Failed to create admin');
    }
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      type: branch.type
    });
    setModalOpen(true);
  };

  const openAdminModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setAdminModalOpen(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="branch-management">
      <div className="page-header">
        <h1>Branch Management</h1>
        <div className="header-actions">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Branches</option>
            <option value="company">Company Branches</option>
            <option value="franchise">Franchises</option>
          </select>
          <Button onClick={() => {
            setEditingBranch(null);
            setFormData({ name: '', location: '', type: 'company' });
            setModalOpen(true);
          }}>Add Branch</Button>
        </div>
      </div>

      <Card>
        <div className="branches-table-container">
          <table className="branches-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Location</th>
                <th>Type</th>
                <th>Staff Count</th>
                <th>Orders</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td><strong>{branch.name}</strong></td>
                  <td>{branch.location}</td>
                  <td>
                    <span className={`branch-type ${branch.type}`}>
                      {branch.type === 'company' ? 'Company' : 'Franchise'}
                    </span>
                  </td>
                  <td>{branch.users_count || 0}</td>
                  <td>{branch.orders_count || 0}</td>
                  <td>{new Date(branch.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <Button size="small" onClick={() => openEditModal(branch)}>Edit</Button>
                    <Button size="small" variant="success" onClick={() => openAdminModal(branch)}>Add Admin</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete(branch.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Branch Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBranch ? 'Edit Branch' : 'Add Branch'}>
        <form onSubmit={handleSubmit} className="branch-form">
          <div className="form-group">
            <label>Branch Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Branch Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'company' | 'franchise' })}
            >
              <option value="company">Company Branch</option>
              <option value="franchise">Franchise</option>
            </select>
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingBranch ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Create Admin Modal */}
      <Modal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} title={`Create Admin for ${selectedBranch?.name}`}>
        <form onSubmit={handleCreateAdmin} className="admin-form">
          <div className="form-group">
            <label>Admin Name</label>
            <input
              type="text"
              value={adminData.name}
              onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={adminData.email}
              onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={adminData.password}
              onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setAdminModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Admin</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BranchManagement;