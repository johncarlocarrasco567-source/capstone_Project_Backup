// src/components/admin/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../services/api';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import './Dashboard.css';

interface DashboardData {
  branch_info: {
    name: string;
    location: string;
    type: string;
  };
  today_sales: {
    total_sales: number;
    order_count: number;
    average_order: number;
  };
  weekly_sales: {
    total_sales: number;
    order_count: number;
    average_order_value: number;
  };
  monthly_sales: {
    total_sales: number;
    order_count: number;
    average_order_value: number;
    growth_percentage?: number;
  };
  inventory_status: {
    total_ingredients: number;
    low_stock_count: number;
    critical_stock_count: number;
    stock_status_percentage: number;
  };
  staff_performance: Array<{
    id: number;
    name: string;
    orders_today: number;
    sales_today: number;
  }>;
  recent_orders: Array<{
    id: number;
    total: number;
    staff: string;
    items_count: number;
    created_at: string;
  }>;
  low_stock_alerts: Array<{
    ingredient: string;
    quantity: number;
    unit: string;
    status: string;
  }>;
  pending_reports: number;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await getAdminDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-dashboard">
      <h1>{data?.branch_info.name} Dashboard</h1>
      <p className="branch-location">{data?.branch_info.location}</p>

      <div className="stats-grid">
        <Card title="Today's Sales">
          <div className="stat-value">₱{data?.today_sales.total_sales.toLocaleString()}</div>
          <div className="stat-detail">
            <span>Orders: {data?.today_sales.order_count}</span>
            <span>Avg: ₱{data?.today_sales.average_order?.toFixed(2)}</span>
          </div>
        </Card>

        <Card title="This Week">
          <div className="stat-value">₱{data?.weekly_sales.total_sales.toLocaleString()}</div>
          <div className="stat-detail">
            <span>Orders: {data?.weekly_sales.order_count}</span>
          </div>
        </Card>

        <Card title="This Month">
          <div className="stat-value">₱{data?.monthly_sales.total_sales.toLocaleString()}</div>
          <div className="stat-detail">
            <span>Orders: {data?.monthly_sales.order_count}</span>
            {data?.monthly_sales.growth_percentage !== undefined && (
              <span className={data?.monthly_sales.growth_percentage >= 0 ? 'positive' : 'negative'}>
                {data?.monthly_sales.growth_percentage?.toFixed(1)}% vs last month
              </span>
            )}
          </div>
        </Card>

        <Card title="Inventory Status">
          <div className="stat-value">{data?.inventory_status.stock_status_percentage?.toFixed(0)}%</div>
          <div className="stat-detail">
            <span>Low Stock: {data?.inventory_status.low_stock_count}</span>
            <span className="critical">Critical: {data?.inventory_status.critical_stock_count}</span>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Low Stock Alerts">
          <div className="alerts-list">
            {data?.low_stock_alerts && data?.low_stock_alerts.length === 0 ? (
              <p>No low stock alerts</p>
            ) : (
              data?.low_stock_alerts?.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.status}`}>
                  <span className="alert-ingredient">{alert.ingredient}</span>
                  <span className="alert-quantity">{alert.quantity} {alert.unit}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Staff Performance (Today)">
          <div className="staff-list">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Orders</th>
                  <th>Sales</th>
                </tr>
              </thead>
              <tbody>
                {data?.staff_performance?.map((staff) => (
                  <tr key={staff.id}>
                    <td>{staff.name}</td>
                    <td>{staff.orders_today}</td>
                    <td>₱{staff.sales_today.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Recent Orders">
          <div className="orders-list">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Staff</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_orders?.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.staff}</td>
                    <td>{order.items_count}</td>
                    <td>₱{order.total.toLocaleString()}</td>
                    <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;