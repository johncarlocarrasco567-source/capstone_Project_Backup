// src/components/superadmin/ReportReview.tsx

import React, { useEffect, useState } from 'react';
import { getReports, approveReport, rejectReport } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './ReportReview.css';

interface Report {
  id: number;
  title: string;
  type: 'product_proposal' | 'damage' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  response?: string;
  branch: {
    id: number;
    name: string;
  };
  admin: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

const ReportReview: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchReports();
  }, [filterStatus, filterType]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      
      const response = await getReports(params);
      setReports(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReport || !responseText.trim()) {
      toast.error('Please provide a response');
      return;
    }
    
    try {
      await approveReport(selectedReport.id, responseText);
      toast.success('Report approved successfully');
      setModalOpen(false);
      setSelectedReport(null);
      setResponseText('');
      fetchReports();
    } catch (error) {
      toast.error('Failed to approve report');
    }
  };

  const handleReject = async () => {
    if (!selectedReport || !responseText.trim()) {
      toast.error('Please provide a response');
      return;
    }
    
    try {
      await rejectReport(selectedReport.id, responseText);
      toast.success('Report rejected');
      setModalOpen(false);
      setSelectedReport(null);
      setResponseText('');
      fetchReports();
    } catch (error) {
      toast.error('Failed to reject report');
    }
  };

  const openReportModal = (report: Report) => {
    setSelectedReport(report);
    setResponseText('');
    setModalOpen(true);
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product_proposal': return 'Product Proposal';
      case 'damage': return 'Damage Report';
      case 'other': return 'Other Concern';
      default: return type;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="report-review">
      <div className="page-header">
        <h1>Report Review</h1>
        <div className="filter-controls">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="product_proposal">Product Proposals</option>
            <option value="damage">Damage Reports</option>
            <option value="other">Other Concerns</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Branch</th>
                <th>From</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td><strong>{report.title}</strong></td>
                  <td>{getTypeLabel(report.type)}</td>
                  <td>{report.branch?.name}</td>
                  <td>{report.admin?.name}</td>
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
                    {report.status === 'pending' && (
                      <Button size="small" onClick={() => openReportModal(report)}>Review</Button>
                    )}
                    {report.response && (
                      <Button size="small" variant="secondary" onClick={() => {
                        setSelectedReport(report);
                        setResponseText(report.response || '');
                        setModalOpen(true);
                      }}>View Response</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Review Report: ${selectedReport?.title}`}>
        {selectedReport && (
          <div className="report-details">
            <div className="report-info">
              <div className="info-row">
                <label>Branch:</label>
                <span>{selectedReport.branch?.name}</span>
              </div>
              <div className="info-row">
                <label>Submitted by:</label>
                <span>{selectedReport.admin?.name} ({selectedReport.admin?.email})</span>
              </div>
              <div className="info-row">
                <label>Type:</label>
                <span>{getTypeLabel(selectedReport.type)}</span>
              </div>
              <div className="info-row">
                <label>Priority:</label>
                <span style={{ color: getPriorityColor(selectedReport.priority) }}>
                  {selectedReport.priority.toUpperCase()}
                </span>
              </div>
              <div className="info-row">
                <label>Date:</label>
                <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
              </div>
              <div className="info-row description">
                <label>Description:</label>
                <p>{selectedReport.description}</p>
              </div>
            </div>

            {selectedReport.status !== 'pending' && selectedReport.response && (
              <div className="existing-response">
                <h3>Previous Response:</h3>
                <p>{selectedReport.response}</p>
                <p className="response-status">
                  Status: <span style={{ color: getStatusColor(selectedReport.status) }}>
                    {selectedReport.status.toUpperCase()}
                  </span>
                </p>
              </div>
            )}

            {selectedReport.status === 'pending' && (
              <div className="response-form">
                <div className="form-group">
                  <label>Your Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={5}
                    placeholder="Enter your response to this report..."
                    required
                  />
                </div>
                <div className="form-actions">
                  <Button variant="danger" onClick={handleReject}>Reject</Button>
                  <Button variant="success" onClick={handleApprove}>Approve</Button>
                </div>
              </div>
            )}

            {selectedReport.status !== 'pending' && (
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportReview;