// src/components/admin/OrderMonitoring.tsx

import React, { useEffect, useState } from 'react';
import { getOrders, getOrderDetails, getTodayOrderSummary } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import './OrderMonitoring.css';

interface Order {
  id: number;
  total_amount: number;
  payment: number;
  change: number;
  staff: string;
  items_count: number;
  created_at: string;
}

interface OrderDetail {
  id: number;
  total_amount: number;
  payment: number;
  change_amount: number;
  staff: { id: number; name: string };
  branch: { id: number; name: string };
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  created_at: string;
}

const OrderMonitoring: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        getOrders(),
        getTodayOrderSummary()
      ]);
      setOrders(ordersRes.data.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (id: number) => {
    try {
      const response = await getOrderDetails(id);
      setSelectedOrder(response.data);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="order-monitoring">
      <h1>Order Monitoring</h1>

      {summary && (
        <div className="summary-cards">
          <Card title="Today's Summary">
            <div className="summary-stats">
              <div className="stat">
                <label>Total Orders</label>
                <span className="value">{summary.total_orders}</span>
              </div>
              <div className="stat">
                <label>Total Sales</label>
                <span className="value">₱{summary.total_sales.toLocaleString()}</span>
              </div>
              <div className="stat">
                <label>Average Order</label>
                <span className="value">₱{summary.average_order_value?.toFixed(2)}</span>
              </div>
              <div className="stat">
                <label>Peak Hour</label>
                <span className="value">{summary.peak_hour}</span>
              </div>
            </div>
          </Card>

          {summary.top_products && summary.top_products.length > 0 && (
            <Card title="Top Products Today">
              <div className="top-products">
                {summary.top_products.map((product: any) => (
                  <div key={product.id} className="product-item">
                    <span className="product-name">{product.name}</span>
                    <span className="product-quantity">x{product.total_quantity}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <Card title="Recent Orders">
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Staff</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.staff}</td>
                  <td>{order.items_count}</td>
                  <td>₱{order.total_amount.toLocaleString()}</td>
                  <td>₱{order.payment.toLocaleString()}</td>
                  <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                  <td>
                    <Button size="small" onClick={() => handleViewOrder(order.id)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Order #${selectedOrder?.id}`}>
        {selectedOrder && (
          <div className="order-details">
            <div className="order-info">
              <p><strong>Staff:</strong> {selectedOrder.staff.name}</p>
              <p><strong>Branch:</strong> {selectedOrder.branch.name}</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>₱{item.price.toFixed(2)}</td>
                    <td>₱{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}><strong>Total</strong></td>
                  <td><strong>₱{selectedOrder.total_amount.toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td colSpan={3}>Payment</td>
                  <td>₱{selectedOrder.payment.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3}>Change</td>
                  <td>₱{selectedOrder.change_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderMonitoring;