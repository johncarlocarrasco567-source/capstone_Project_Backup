// src/screens/POSScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, processOrder, toggleProductVisibility } from '../services/api';
import { Product, CartItem } from '../types';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 60) / 2;

interface POSScreenProps {
  navigation: any;
}

const POSScreen: React.FC<POSScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payment, setPayment] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      let productsData: any[] = [];
      const responseData = response.data as any;
      
      if (Array.isArray(responseData)) {
        productsData = responseData;
      } else if (responseData && responseData.products && Array.isArray(responseData.products)) {
        productsData = responseData.products;
      }
      
      const formattedProducts: Product[] = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
        image: p.image || null,
        category: p.category?.name || p.category || 'Uncategorized',
        type: p.type,
        is_available: p.is_available !== undefined ? p.is_available : true,
        quantity: p.quantity
      }));
      
      setProducts(formattedProducts);
      
      const uniqueCategories = ['All', ...new Set(formattedProducts.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product) => {
    if (!product.is_available) return;
    
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product_id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.price }
            : item
        );
      }
      return [...prevCart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product_id === productId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handlePayment = async () => {
    const paymentAmount = parseFloat(payment);
    if (isNaN(paymentAmount) || paymentAmount < getTotal()) {
      Alert.alert('Error', 'Insufficient payment amount');
      return;
    }

    setProcessing(true);
    try {
      const orderItems = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const response = await processOrder(orderItems, paymentAmount);
      setPaymentModal(false);
      setPayment('');
      setCart([]);
      
      Alert.alert(
        '🎉 Order Successful!',
        `Total: ₱${response.data.order.total_amount}\nChange: ₱${response.data.order.change}`,
        [{ text: 'OK' }]
      );
      
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to process order');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const CategoryButton = ({ category, isActive, onPress }: any) => (
    <TouchableOpacity
      style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryButtonText, isActive && styles.categoryButtonTextActive]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, !item.is_available && styles.productCardDisabled]}
      onPress={() => addToCart(item)}
      onLongPress={() => {
        Alert.alert(
          'Toggle Product',
          `Do you want to ${item.is_available ? 'hide' : 'show'} ${item.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: async () => {
                try {
                  await toggleProductVisibility(item.id, !item.is_available);
                  loadProducts();
                } catch (error) {
                  Alert.alert('Error', 'Failed to toggle product');
                }
              },
            },
          ]
        );
      }}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="fast-food-outline" size={40} color="#ccc" />
        </View>
      )}
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
      {!item.is_available && (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableBadgeText}>OUT</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant-outline" size={28} color="#fff" />
          <Text style={styles.headerTitle}>POS System</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.mainContent}>
        {/* Products Section */}
        <View style={styles.productsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(category => (
              <CategoryButton
                key={category}
                category={category}
                isActive={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}
          </ScrollView>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            renderItem={renderProductItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
            }
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            }
          />
        </View>

        {/* Cart Section */}
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <Ionicons name="cart-outline" size={24} color="#667eea" />
            <Text style={styles.cartTitle}>Your Order</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          </View>

          <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
            {cart.map((item) => (
              <View key={item.product_id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>₱{item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.cartItemControls}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
                    style={styles.qtyButton}
                  >
                    <Ionicons name="remove-outline" size={20} color="#667eea" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                    style={styles.qtyButton}
                  >
                    <Ionicons name="add-outline" size={20} color="#667eea" />
                  </TouchableOpacity>
                  <Text style={styles.itemSubtotal}>₱{item.subtotal.toFixed(2)}</Text>
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.product_id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {cart.length === 0 && (
              <View style={styles.emptyCartContainer}>
                <Ionicons name="cart-outline" size={50} color="#ddd" />
                <Text style={styles.emptyCartText}>Cart is empty</Text>
                <Text style={styles.emptyCartSubText}>Tap products to add</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₱{getTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutButton, cart.length === 0 && styles.checkoutDisabled]}
              onPress={() => setPaymentModal(true)}
              disabled={cart.length === 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={cart.length === 0 ? ['#ccc', '#ccc'] : ['#28a745', '#20c997']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutGradient}
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
                <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={paymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Ionicons name="cash-outline" size={30} color="#fff" />
              <Text style={styles.modalTitle}>Payment</Text>
            </LinearGradient>
            
            <View style={styles.modalBody}>
              <Text style={styles.totalDue}>Total Due</Text>
              <Text style={styles.totalDueAmount}>₱{getTotal().toFixed(2)}</Text>
              
              <TextInput
                style={styles.paymentInput}
                placeholder="Enter payment amount"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={payment}
                onChangeText={setPayment}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setPaymentModal(false);
                    setPayment('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.payButton]}
                  onPress={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  logoutButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  productsSection: {
    flex: 2,
    marginRight: 12,
  },
  categoriesScroll: {
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#667eea',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  productList: {
    paddingBottom: 10,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    width: PRODUCT_CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: 'bold',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  cartSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  cartBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartList: {
    flex: 1,
    maxHeight: 350,
  },
  cartItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    backgroundColor: '#f8f9fa',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 70,
    textAlign: 'right',
    marginLeft: 'auto',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  cartFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 10,
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 10,
  },
  emptyCartSubText: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 12,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  modalBody: {
    padding: 20,
  },
  totalDue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  totalDueAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#28a745',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default POSScreen;