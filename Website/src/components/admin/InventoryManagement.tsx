// src/components/admin/InventoryManagement.tsx

import React, { useEffect, useState } from 'react';
import { getIngredients, updateIngredientStock, addIngredient, getProductStocks, recordWaste, adjustStock, getStockHistory } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './InventoryManagement.css';

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
  price: number;
  status: string;
}

const InventoryManagement: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [stockData, setStockData] = useState({ quantity: '', operation: 'add' });
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: '' });
  const [wasteData, setWasteData] = useState({ quantity: '', reason: '' });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ingredientsRes, stocksRes] = await Promise.all([
        getIngredients(),
        getProductStocks()
      ]);
      setIngredients(ingredientsRes.data);
      setProductStocks(stocksRes.data);
    } catch (error) {
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;

    try {
      await updateIngredientStock(
        selectedIngredient.id,
        parseFloat(stockData.quantity),
        stockData.operation as 'add' | 'subtract' | 'set'
      );
      toast.success('Stock updated successfully');
      setModalOpen(false);
      setStockData({ quantity: '', operation: 'add' });
      fetchData();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addIngredient(newIngredient);
      toast.success('Ingredient added successfully');
      setModalOpen(false);
      setNewIngredient({ name: '', unit: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add ingredient');
    }
  };

  const handleRecordWaste = async (ingredient: Ingredient) => {
    const quantity = prompt('Enter waste quantity:', '0');
    const reason = prompt('Reason for waste:');
    
    if (quantity && reason) {
      try {
        await recordWaste(ingredient.id, parseFloat(quantity), reason);
        toast.success('Waste recorded successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to record waste');
      }
    }
  };

  const handleViewHistory = async (ingredient: Ingredient) => {
    try {
      const response = await getStockHistory(ingredient.id);
      setHistory(response.data);
      setSelectedIngredient(ingredient);
      setHistoryModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch history');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#dc3545';
      case 'low': return '#f39c12';
      case 'medium': return '#17a2b8';
      case 'good': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="inventory-management">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <Button onClick={() => setModalOpen(true)}>Add Ingredient</Button>
      </div>

      <div className="inventory-grid">
        <Card title="Ingredients">
          <div className="ingredients-list">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id}>
                    <td>{ing.name}</td>
                    <td>{ing.quantity}</td>
                    <td>{ing.unit}</td>
                    <td>
                      <span style={{ color: getStatusColor(ing.status) }} className="status-text">
                        {ing.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="actions">
                      <Button size="small" onClick={() => {
                        setSelectedIngredient(ing);
                        setStockData({ quantity: '', operation: 'add' });
                        setModalOpen(true);
                      }}>Update</Button>
                      <Button size="small" variant="danger" onClick={() => handleRecordWaste(ing)}>Waste</Button>
                      <Button size="small" variant="secondary" onClick={() => handleViewHistory(ing)}>History</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Stock-Based Products">
          <div className="stocks-list">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {productStocks.map((stock) => (
                  <tr key={stock.id}>
                    <td>{stock.name}</td>
                    <td>{stock.quantity}</td>
                    <td>₱{stock.price}</td>
                    <td>
                      <span style={{ color: getStatusColor(stock.status) }} className="status-text">
                        {stock.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Update Stock Modal */}
      <Modal isOpen={modalOpen && selectedIngredient !== null} onClose={() => setModalOpen(false)} title={`Update Stock - ${selectedIngredient?.name}`}>
        <form onSubmit={handleUpdateStock} className="stock-form">
          <div className="form-group">
            <label>Operation</label>
            <select
              value={stockData.operation}
              onChange={(e) => setStockData({ ...stockData, operation: e.target.value })}
            >
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
              <option value="set">Set</option>
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              step="0.01"
              value={stockData.quantity}
              onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      {/* Add Ingredient Modal */}
      <Modal isOpen={modalOpen && selectedIngredient === null} onClose={() => setModalOpen(false)} title="Add New Ingredient">
        <form onSubmit={handleAddIngredient} className="stock-form">
          <div className="form-group">
            <label>Ingredient Name</label>
            <input
              type="text"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input
              type="text"
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
              required
              placeholder="kg, g, ml, pcs, etc."
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title={`Stock History - ${selectedIngredient?.name}`}>
        <div className="history-list">
          {history.length === 0 ? (
            <p>No history found</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>{item.type}</td>
                    <td>{item.quantity}</td>
                    <td>{item.previous_quantity}</td>
                    <td>{item.new_quantity}</td>
                    <td>{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryManagement;