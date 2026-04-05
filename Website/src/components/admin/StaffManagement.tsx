// src/components/admin/StaffManagement.tsx

import React, { useEffect, useState } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './StaffManagement.css';

interface Staff {
  id: number;
  name: string;
  email: string;
  orders_today: number;
  sales_today: number;
  created_at: string;
}

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await getStaff();
      setStaff(response.data);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, { name: formData.name, email: formData.email });
        toast.success('Staff updated successfully');
      } else {
        await createStaff(formData);
        toast.success('Staff created successfully');
      }
      setModalOpen(false);
      setEditingStaff(null);
      setFormData({ name: '', email: '', password: '' });
      fetchStaff();
    } catch (error) {
      toast.error('Failed to save staff');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id);
        toast.success('Staff deleted successfully');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to delete staff');
      }
    }
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({ name: staff.name, email: staff.email, password: '' });
    setModalOpen(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="staff-management">
      <div className="page-header">
        <h1>Staff Management</h1>
        <Button onClick={() => {
          setEditingStaff(null);
          setFormData({ name: '', email: '', password: '' });
          setModalOpen(true);
        }}>Add Staff</Button>
      </div>

      <Card>
        <div className="staff-table-container">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Orders Today</th>
                <th>Sales Today</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.orders_today}</td>
                  <td>₱{member.sales_today.toLocaleString()}</td>
                  <td>{new Date(member.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <Button size="small" onClick={() => openEditModal(member)}>Edit</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete(member.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingStaff ? 'Edit Staff' : 'Add Staff'}>
        <form onSubmit={handleSubmit} className="staff-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          {!editingStaff && (
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingStaff ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffManagement;