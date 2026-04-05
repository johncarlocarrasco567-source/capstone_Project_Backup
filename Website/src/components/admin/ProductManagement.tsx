// src/components/admin/ProductManagement.tsx

import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, addProductRecipe, setProductStock, getIngredients, getCategories } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './ProductManagement.css';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
  type: 'ingredient_based' | 'stock_based';
  is_available: boolean;
  recipe_count?: number;
  quantity?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: 'ingredient_based',
    category_id: '',
    image: null as File | null
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    type: 'ingredient_based',
    category_id: '',
    image: null as File | null
  });
  const [recipeData, setRecipeData] = useState<Array<{ ingredient_id: number; quantity_needed: string }>>([]);
  const [stockQuantity, setStockQuantity] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, ingredientsRes] = await Promise.all([
        getProducts(),
        getIngredients()
      ]);
      setProducts(productsRes.data);
      setIngredients(ingredientsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isEdit) {
        setEditFormData({ ...editFormData, image: file });
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFormData({ ...formData, image: file });
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('type', formData.type);
    if (formData.category_id) formDataToSend.append('category_id', formData.category_id);
    if (formData.image) formDataToSend.append('image', formData.image);
    
    try {
      await createProduct(formDataToSend);
      toast.success('Product created successfully');
      setModalOpen(false);
      setFormData({ name: '', price: '', type: 'ingredient_based', category_id: '', image: null });
      setImagePreview(null);
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create product';
      toast.error(message);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', editFormData.name);
    formDataToSend.append('price', editFormData.price);
    formDataToSend.append('type', editFormData.type);
    if (editFormData.category_id) formDataToSend.append('category_id', editFormData.category_id);
    if (editFormData.image) formDataToSend.append('image', editFormData.image);
    formDataToSend.append('_method', 'PUT');
    
    try {
      await updateProduct(selectedProduct.id, formDataToSend);
      toast.success('Product updated successfully');
      setEditModalOpen(false);
      setSelectedProduct(null);
      setEditFormData({ name: '', price: '', type: 'ingredient_based', category_id: '', image: null });
      setEditImagePreview(null);
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    }
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const ingredients = recipeData.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity_needed: parseFloat(ing.quantity_needed)
      }));
      await addProductRecipe(selectedProduct.id, ingredients);
      toast.success('Recipe added successfully');
      setRecipeModalOpen(false);
      setRecipeData([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to add recipe');
    }
  };

  const handleSetStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await setProductStock(selectedProduct.id, parseInt(stockQuantity));
      toast.success('Stock updated successfully');
      setRecipeModalOpen(false);
      setStockQuantity('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditFormData({
      name: product.name,
      price: product.price.toString(),
      type: product.type,
      category_id: '',
      image: null
    });
    setEditImagePreview(product.image || null);
    setEditModalOpen(true);
  };

  const openRecipeModal = (product: Product) => {
    setSelectedProduct(product);
    setRecipeData([]);
    setRecipeModalOpen(true);
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockQuantity(product.quantity?.toString() || '');
    setRecipeModalOpen(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>Product Management</h1>
        <Button onClick={() => setModalOpen(true)}>Add Product</Button>
      </div>

      <Card>
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="product-image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="product-image-placeholder">📷</div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>₱{product.price.toFixed(2)}</td>
                  <td>{product.type === 'ingredient_based' ? 'Ingredient Based' : 'Stock Based'}</td>
                  <td>
                    <span className={`status-badge ${product.is_available ? 'available' : 'unavailable'}`}>
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="actions">
                    <Button size="small" onClick={() => openEditModal(product)}>Edit</Button>
                    {product.type === 'ingredient_based' && (
                      <Button size="small" onClick={() => openRecipeModal(product)}>Add Recipe</Button>
                    )}
                    {product.type === 'stock_based' && (
                      <Button size="small" onClick={() => openStockModal(product)}>Set Stock</Button>
                    )}
                    <Button size="small" variant="danger" onClick={() => handleDeleteProduct(product.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Product Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Product">
        <form onSubmit={handleCreateProduct} className="product-form">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Product Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="ingredient_based">Ingredient Based</option>
              <option value="stock_based">Stock Based</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, false)}
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => {
              setModalOpen(false);
              setImagePreview(null);
              setFormData({ name: '', price: '', type: 'ingredient_based', category_id: '', image: null });
            }}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Product: ${selectedProduct?.name}`}>
        <form onSubmit={handleEditProduct} className="product-form">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              value={editFormData.category_id}
              onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={editFormData.price}
              onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Product Type</label>
            <select
              value={editFormData.type}
              onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
            >
              <option value="ingredient_based">Ingredient Based</option>
              <option value="stock_based">Stock Based</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Image</label>
            {editImagePreview && (
              <div className="image-preview">
                <img src={editImagePreview} alt="Current" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, true)}
            />
            <small>Leave empty to keep current image</small>
          </div>
          
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      {/* Recipe Modal */}
      <Modal isOpen={recipeModalOpen && selectedProduct?.type === 'ingredient_based'} onClose={() => setRecipeModalOpen(false)} title={`Add Recipe for ${selectedProduct?.name}`}>
        <form onSubmit={handleAddRecipe}>
          {recipeData.map((ing, index) => (
            <div key={index} className="recipe-row">
              <select
                value={ing.ingredient_id}
                onChange={(e) => {
                  const newData = [...recipeData];
                  newData[index].ingredient_id = parseInt(e.target.value);
                  setRecipeData(newData);
                }}
                required
              >
                <option value="">Select Ingredient</option>
                {ingredients.map(ingredient => (
                  <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Quantity"
                value={ing.quantity_needed}
                onChange={(e) => {
                  const newData = [...recipeData];
                  newData[index].quantity_needed = e.target.value;
                  setRecipeData(newData);
                }}
                required
              />
              <Button
                type="button"
                variant="danger"
                size="small"
                onClick={() => setRecipeData(recipeData.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRecipeData([...recipeData, { ingredient_id: 0, quantity_needed: '' }])}
          >
            Add Ingredient
          </Button>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setRecipeModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Recipe</Button>
          </div>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal isOpen={recipeModalOpen && selectedProduct?.type === 'stock_based'} onClose={() => setRecipeModalOpen(false)} title={`Set Stock for ${selectedProduct?.name}`}>
        <form onSubmit={handleSetStock}>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setRecipeModalOpen(false)}>Cancel</Button>
            <Button type="submit">Update Stock</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductManagement;