// src/components/superadmin/InventoryView.tsx

import React, { useEffect, useState } from 'react';
import { getBranches, getBranchInventory, getAllInventorySummary } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './InventoryView.css';

interface Branch {
  id: number;
  name: string;
  type: string;
}

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  status: string;
}

interface ProductStock {
  id: number;
  name: string;
  quantity: number;
  status: string;
}

const InventoryView: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [globalSummary, setGlobalSummary] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
    fetchGlobalSummary();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchBranchInventory();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await getBranches({ per_page: 100 });
      setBranches(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedBranch(response.data.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to fetch branches');
    }
  };

  const fetchBranchInventory = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const response = await getBranchInventory(selectedBranch);
      setIngredients(response.data.ingredients);
      setProductStocks(response.data.stock_products);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSummary = async () => {
    try {
      const response = await getAllInventorySummary();
      setGlobalSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch global summary');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#dc3545';
      case 'low': return '#f39c12';
      case 'medium': return '#17a2b8';
      case 'good': return '#28a745';
      case 'out_of_stock': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Critical';
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'good': return 'Good';
      case 'out_of_stock': return 'Out of Stock';
      default: return status;
    }
  };

  return (
    <div className="inventory-view">
      <h1>Inventory View</h1>

      <div className="inventory-controls">
        <div className="branch-selector">
          <label>Select Branch:</label>
          <select 
            value={selectedBranch || ''} 
            onChange={(e) => setSelectedBranch(Number(e.target.value))}
          >
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.type === 'company' ? 'Company' : 'Franchise'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBranch && (
        <>
          <div className="inventory-summary-cards">
            <Card title="Inventory Summary">
              <div className="summary-stats">
                <div className="summary-stat">
                  <label>Total Ingredients</label>
                  <span className="value">{summary?.total_ingredients || 0}</span>
                </div>
                <div className="summary-stat">
                  <label>Low Stock Items</label>
                  <span className="value warning">{summary?.low_stock_items || 0}</span>
                </div>
                <div className="summary-stat">
                  <label>Critical Stock</label>
                  <span className="value critical">{summary?.critical_stock_items || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="inventory-grid">
            <Card title="Ingredients">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="ingredients-list">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ing) => (
                        <tr key={ing.id}>
                          <td>{ing.name}</td>
                          <td>{ing.quantity}</td>
                          <td>{ing.unit}</td>
                          <td>
                            <span style={{ color: getStatusColor(ing.status) }} className="status-badge">
                              {getStatusText(ing.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Stock-Based Products">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="stocks-list">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productStocks.map((stock) => (
                        <tr key={stock.id}>
                          <td>{stock.name}</td>
                          <td>{stock.quantity}</td>
                          <td>
                            <span style={{ color: getStatusColor(stock.status) }} className="status-badge">
                              {getStatusText(stock.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <Card title="All Branches Inventory Summary">
        <div className="global-summary">
          <table className="global-summary-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Type</th>
                <th>Total Ingredients</th>
                <th>Low Stock</th>
                <th>Critical</th>
              </tr>
            </thead>
            <tbody>
              {globalSummary.map((branch) => (
                <tr key={branch.branch_id}>
                  <td><strong>{branch.branch_name}</strong></td>
                  <td>{branch.branch_type === 'company' ? 'Company' : 'Franchise'}</td>
                  <td>{branch.total_ingredients}</td>
                  <td className={branch.low_stock_items > 0 ? 'warning' : ''}>{branch.low_stock_items}</td>
                  <td className={branch.critical_stock_items > 0 ? 'critical' : ''}>{branch.critical_stock_items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InventoryView;