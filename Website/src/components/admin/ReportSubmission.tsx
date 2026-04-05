// src/components/admin/ReportSubmission.tsx

import React, { useEffect, useState } from 'react';
import { getAdminReports, submitReport, updateReport, deleteReport } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Report } from '../../types';
import './ReportSubmission.css';

interface ReportFormData {
  type: 'product_proposal' | 'damage' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

const ReportSubmission: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<ReportFormData>({
    type: 'product_proposal',
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await getAdminReports();
      setReports(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedReport) {
        await updateReport(selectedReport.id, formData);
        toast.success('Report updated successfully');
      } else {
        await submitReport(formData);
        toast.success('Report submitted successfully');
      }
      setModalOpen(false);
      setSelectedReport(null);
      setFormData({ type: 'product_proposal', title: '', description: '', priority: 'medium' });
      fetchReports();
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteReport(id);
        toast.success('Report deleted successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to delete report');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#f39c12';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#f39c12';
      default: return '#6c757d';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="report-submission">
      <div className="page-header">
        <h1>Reports</h1>
        <Button onClick={() => {
          setSelectedReport(null);
          setFormData({ type: 'product_proposal', title: '', description: '', priority: 'medium' });
          setModalOpen(true);
        }}>Submit Report</Button>
      </div>

      <Card>
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td>
                    {report.type === 'product_proposal' ? 'Product Proposal' :
                     report.type === 'damage' ? 'Damage Report' : 'Other'}
                  </td>
                  <td>
                    <span style={{ color: getPriorityColor(report.priority) }} className="priority-badge">
                      {report.priority.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: getStatusColor(report.status) }} className="status-badge">
                      {report.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(report.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <Button size="small" onClick={() => {
                      setSelectedReport(report);
                      setFormData({
                        type: report.type,
                        title: report.title,
                        description: report.description,
                        priority: report.priority
                      });
                      setModalOpen(true);
                    }}>Edit</Button>
                    {report.status === 'pending' && (
                      <Button size="small" variant="danger" onClick={() => handleDelete(report.id)}>Delete</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedReport?.response && (
        <Card title="Response">
          <div className="response-content">
            <p><strong>Status:</strong> {selectedReport.status}</p>
            <p><strong>Response:</strong> {selectedReport.response}</p>
          </div>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedReport ? 'Edit Report' : 'Submit Report'}>
        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label>Report Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="product_proposal">Product Proposal</option>
              <option value="damage">Damage Report</option>
              <option value="other">Other Concern</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{selectedReport ? 'Update' : 'Submit'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReportSubmission;