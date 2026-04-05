// src/components/superadmin/SalesAnalytics.tsx

import React, { useEffect, useState } from 'react';
import { getOverallSales, getBranches, getBranchSales } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './SalesAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Branch {
  id: number;
  name: string;
  type: string;
}

const SalesAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [overallSales, setOverallSales] = useState<any>(null);
  const [branchSales, setBranchSales] = useState<any>(null);

  useEffect(() => {
    fetchBranches();
    fetchOverallSales();
  }, [period]);

  useEffect(() => {
    if (selectedBranch) {
      fetchBranchSales();
    }
  }, [selectedBranch, period]);

  const fetchBranches = async () => {
    try {
      const response = await getBranches({ per_page: 100 });
      setBranches(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedBranch(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch branches');
    }
  };

  const fetchOverallSales = async () => {
    setLoading(true);
    try {
      const response = await getOverallSales(period);
      setOverallSales(response.data);
    } catch (error) {
      console.error('Failed to fetch overall sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchSales = async () => {
    if (!selectedBranch) return;
    try {
      const response = await getBranchSales(selectedBranch, period);
      setBranchSales(response.data.data);
    } catch (error) {
      console.error('Failed to fetch branch sales');
    }
  };

  const getChartData = () => {
    if (!branchSales?.sales_by_day) return null;
    
    const labels = branchSales.sales_by_day.map((item: any) => {
      if (period === 'daily') return new Date(item.date).toLocaleTimeString();
      if (period === 'weekly') return new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
      return new Date(item.date).toLocaleDateString();
    });
    
    const sales = branchSales.sales_by_day.map((item: any) => item.total);
    
    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: sales,
          backgroundColor: 'rgba(102, 126, 234, 0.5)',
          borderColor: '#667eea',
          borderWidth: 2,
        },
      ],
    };
  };

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="sales-analytics">
      <h1>Sales Analytics</h1>

      <div className="analytics-controls">
        <div className="period-selector">
          <Button 
            size="small" 
            variant={period === 'daily' ? 'primary' : 'secondary'}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </Button>
          <Button 
            size="small" 
            variant={period === 'weekly' ? 'primary' : 'secondary'}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </Button>
          <Button 
            size="small" 
            variant={period === 'monthly' ? 'primary' : 'secondary'}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </Button>
        </div>
      </div>

      <div className="overall-stats">
        <Card title="Overall Sales">
          <div className="stat-value">₱{overallSales?.total_sales?.toLocaleString() || 0}</div>
          <div className="stat-detail">
            <span>Total Orders: {overallSales?.total_orders || 0}</span>
            <span>Average Order: ₱{overallSales?.average_order_value?.toFixed(2) || 0}</span>
          </div>
        </Card>
      </div>

      <div className="analytics-grid">
        <Card title="Branch Sales">
          <div className="branch-selector">
            <select 
              value={selectedBranch || ''} 
              onChange={(e) => setSelectedBranch(Number(e.target.value))}
            >
              {branches.filter(b => b.type === 'company').map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          
          {branchSales && (
            <div className="branch-sales-stats">
              <div className="branch-stat">
                <label>Total Sales</label>
                <span>₱{branchSales.total_sales?.toLocaleString() || 0}</span>
              </div>
              <div className="branch-stat">
                <label>Order Count</label>
                <span>{branchSales.order_count || 0}</span>
              </div>
              <div className="branch-stat">
                <label>Average Order</label>
                <span>₱{branchSales.average_order_value?.toFixed(2) || 0}</span>
              </div>
              {branchSales.growth_percentage !== undefined && (
                <div className="branch-stat">
                  <label>Growth</label>
                  <span className={branchSales.growth_percentage >= 0 ? 'positive' : 'negative'}>
                    {branchSales.growth_percentage >= 0 ? '+' : ''}{branchSales.growth_percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="Sales Chart">
          <div className="chart-container">
            {getChartData() ? (
              <Bar data={getChartData()!} options={chartOptions} height={300} />
            ) : (
              <p>No data available for this period</p>
            )}
          </div>
        </Card>
      </div>

      <Card title="All Branches Performance">
        <div className="performance-table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Type</th>
                <th>Total Sales</th>
                <th>Orders</th>
                <th>Average Order</th>
              </tr>
            </thead>
            <tbody>
              {branches.filter(b => b.type === 'company').map(branch => (
                <tr key={branch.id}>
                  <td>{branch.name}</td>
                  <td>{branch.type === 'company' ? 'Company' : 'Franchise'}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SalesAnalytics;