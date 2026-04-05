// src/components/superadmin/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { getOverallSales, getReports, getAllInventorySummary, getBranches } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  total_branches: number;
  total_company_branches: number;
  total_franchises: number;
  total_admins: number;
  pending_reports: number;
  overall_sales: {
    total_sales: number;
    total_orders: number;
    average_order_value: number;
    branches_count: number;
  };
  branch_performance: Array<{
    branch_id: number;
    branch_name: string;
    total_sales: number;
    order_count: number;
    growth: number;
  }>;
  inventory_alerts: Array<{
    branch_name: string;
    ingredient_name: string;
    quantity: number;
    unit: string;
  }>;
  recent_reports: Array<{
    id: number;
    title: string;
    type: string;
    branch: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
  sales_chart_data?: any;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [salesRes, reportsRes, inventoryRes, branchesRes] = await Promise.all([
        getOverallSales(selectedPeriod),
        getReports({ status: 'pending', per_page: 5 }),
        getAllInventorySummary(),
        getBranches({ per_page: 100 })
      ]);

      const recentReportsRes = await getReports({ per_page: 10 });
      
      const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Sales',
            data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
          },
        ],
      };

      // Safely extract branches count
      let totalBranches = 0;
      let companyBranches = 0;
      let franchiseBranches = 0;
      
      if (branchesRes.data?.data && Array.isArray(branchesRes.data.data)) {
        totalBranches = branchesRes.data.data.length;
        companyBranches = branchesRes.data.data.filter((b: any) => b.type === 'company').length;
        franchiseBranches = branchesRes.data.data.filter((b: any) => b.type === 'franchise').length;
      } else if (Array.isArray(branchesRes.data)) {
        totalBranches = branchesRes.data.length;
        companyBranches = branchesRes.data.filter((b: any) => b.type === 'company').length;
        franchiseBranches = branchesRes.data.filter((b: any) => b.type === 'franchise').length;
      }

      // Process inventory alerts - handle different possible data structures
      let inventoryAlerts: DashboardStats['inventory_alerts'] = [];
      if (Array.isArray(inventoryRes.data)) {
        inventoryAlerts = inventoryRes.data.map((item: any) => ({
          branch_name: item.branch_name || item.branch?.name || item.branch || 'Unknown',
          ingredient_name: item.ingredient_name || item.ingredient?.name || item.name || 'Ingredient',
          quantity: item.quantity || 0,
          unit: item.unit || ''
        }));
      }

      // Process recent reports - handle different possible data structures
      let recentReports: DashboardStats['recent_reports'] = [];
      const reportsData = recentReportsRes.data?.data || recentReportsRes.data || [];
      if (Array.isArray(reportsData)) {
        recentReports = reportsData.slice(0, 5).map((report: any) => ({
          id: report.id,
          title: typeof report.title === 'object' ? report.title.title || JSON.stringify(report.title) : report.title || 'Untitled',
          type: report.type || 'other',
          branch: typeof report.branch === 'object' ? report.branch.name : report.branch || 'Unknown',
          priority: report.priority || 'low',
          status: report.status || 'pending',
          created_at: report.created_at || new Date().toISOString()
        }));
      }

      setStats({
        total_branches: totalBranches,
        total_company_branches: companyBranches,
        total_franchises: franchiseBranches,
        total_admins: 5,
        pending_reports: reportsRes.data?.total || 0,
        overall_sales: salesRes.data || { total_sales: 0, total_orders: 0, average_order_value: 0, branches_count: 0 },
        branch_performance: [],
        inventory_alerts: inventoryAlerts,
        recent_reports: recentReports,
        sales_chart_data: chartData
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely render numbers
  const safeNumber = (value: any, fallback: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || fallback;
    if (typeof value === 'object' && value !== null) return fallback;
    return fallback;
  };

  if (loading) return <LoadingSpinner />;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="superadmin-dashboard">
      <div className="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <div className="period-selector">
          <Button 
            size="small" 
            variant={selectedPeriod === 'daily' ? 'primary' : 'secondary'}
            onClick={() => setSelectedPeriod('daily')}
          >
            Daily
          </Button>
          <Button 
            size="small" 
            variant={selectedPeriod === 'weekly' ? 'primary' : 'secondary'}
            onClick={() => setSelectedPeriod('weekly')}
          >
            Weekly
          </Button>
          <Button 
            size="small" 
            variant={selectedPeriod === 'monthly' ? 'primary' : 'secondary'}
            onClick={() => setSelectedPeriod('monthly')}
          >
            Monthly
          </Button>
        </div>
      </div>
      
      <div className="stats-grid">
        <Card title="Total Branches">
          <div className="stat-value">{safeNumber(stats?.total_branches)}</div>
          <div className="stat-detail">
            <span>Company: {safeNumber(stats?.total_company_branches)}</span>
            <span>Franchise: {safeNumber(stats?.total_franchises)}</span>
          </div>
        </Card>

        <Card title="Total Admins">
          <div className="stat-value">{safeNumber(stats?.total_admins)}</div>
        </Card>

        <Card title="Pending Reports">
          <div className="stat-value pending">{safeNumber(stats?.pending_reports)}</div>
        </Card>

        <Card title={`Overall Sales (${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)})`}>
          <div className="stat-value">
            ₱{safeNumber(stats?.overall_sales?.total_sales).toLocaleString()}
          </div>
          <div className="stat-detail">
            <span>Orders: {safeNumber(stats?.overall_sales?.total_orders)}</span>
            <span>Avg: ₱{safeNumber(stats?.overall_sales?.average_order_value).toFixed(2)}</span>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Sales Overview">
          <div className="chart-container">
            {stats?.sales_chart_data && (
              <Line data={stats.sales_chart_data} options={chartOptions} height={300} />
            )}
          </div>
        </Card>

        <Card title="Recent Reports">
          <div className="reports-list">
            {!stats?.recent_reports || stats.recent_reports.length === 0 ? (
              <p>No recent reports</p>
            ) : (
              stats.recent_reports.map((report) => (
                <div key={report.id} className="report-item">
                  <div className="report-info">
                    <strong>{String(report.title)}</strong>
                    <span className="report-branch">{String(report.branch)}</span>
                  </div>
                  <div className="report-meta">
                    <span className={`priority-badge ${report.priority}`}>
                      {String(report.priority).toUpperCase()}
                    </span>
                    <span className={`status-badge ${report.status}`}>
                      {String(report.status).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Inventory Alerts">
          <div className="alerts-list">
            {!stats?.inventory_alerts || stats.inventory_alerts.length === 0 ? (
              <p>No inventory alerts</p>
            ) : (
              stats.inventory_alerts.map((alert, index) => (
                <div key={index} className="alert-item">
                  <strong>{String(alert.branch_name)}</strong>
                  <span>{String(alert.ingredient_name)}: {safeNumber(alert.quantity)} {String(alert.unit)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Branch Performance">
          <div className="performance-list">
            {!stats?.branch_performance || stats.branch_performance.length === 0 ? (
              <p>No branch performance data available</p>
            ) : (
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Sales</th>
                    <th>Orders</th>
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.branch_performance.map((branch) => (
                    <tr key={branch.branch_id}>
                      <td>{String(branch.branch_name)}</td>
                      <td>₱{safeNumber(branch.total_sales).toLocaleString()}</td>
                      <td>{safeNumber(branch.order_count)}</td>
                      <td className={branch.growth >= 0 ? 'positive' : 'negative'}>
                        {branch.growth > 0 ? '+' : ''}{safeNumber(branch.growth)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;