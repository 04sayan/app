import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, orderAPI, productAPI, pincodeAPI } from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';

type Section = 'dashboard' | 'orders' | 'products' | 'categories' | 'inventory' | 'delivery' | 'coupons' | 'customers' | 'settings';

export default function ModernAdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter credentials');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await adminAPI.login(username, password);
      if (response.data.success) {
        setIsLoggedIn(true);
      }
    } catch (error: any) {
      Alert.alert('Login Failed', 'Invalid credentials. Use: admin / admin.1');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const menuItems = [
    { id: 'dashboard' as Section, icon: 'grid', label: 'Dashboard' },
    { id: 'orders' as Section, icon: 'receipt', label: 'Orders' },
    { id: 'products' as Section, icon: 'cube', label: 'Products' },
    { id: 'categories' as Section, icon: 'apps', label: 'Categories' },
    { id: 'inventory' as Section, icon: 'archive', label: 'Inventory' },
    { id: 'delivery' as Section, icon: 'car', label: 'Delivery' },
    { id: 'coupons' as Section, icon: 'pricetag', label: 'Coupons' },
    { id: 'customers' as Section, icon: 'people', label: 'Customers' },
    { id: 'settings' as Section, icon: 'settings', label: 'Settings' },
  ];

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.loginBox}>
          <View style={styles.loginHeader}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
            <Text style={styles.loginTitle}>Hatbajar Admin</Text>
            <Text style={styles.loginSubtitle}>Management Portal</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {loginLoading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.hint}>admin / admin.1</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layout}>
        {/* Sidebar */}
        <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.brandText}>🏪 Hatbajar</Text>
          </View>

          <ScrollView style={styles.menu}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, activeSection === item.id && styles.menuItemActive]}
                onPress={() => setActiveSection(item.id)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={activeSection === item.id ? '#2563eb' : '#64748b'}
                />
                {!sidebarCollapsed && (
                  <Text style={[styles.menuText, activeSection === item.id && styles.menuTextActive]}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            {!sidebarCollapsed && <Text style={styles.logoutText}>Logout</Text>}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <Ionicons name="menu" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>
              {menuItems.find(m => m.id === activeSection)?.label}
            </Text>
          </View>

          <ScrollView style={styles.contentArea}>
            {activeSection === 'dashboard' && <DashboardSection />}
            {activeSection === 'orders' && <OrdersSection />}
            {activeSection === 'products' && <ProductsSection />}
            {activeSection === 'categories' && <CategoriesSection />}
            {activeSection === 'inventory' && <InventorySection />}
            {activeSection === 'delivery' && <DeliverySection />}
            {activeSection === 'coupons' && <CouponsSection />}
            {activeSection === 'customers' && <CustomersSection />}
            {activeSection === 'settings' && <SettingsSection />}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Dashboard Section
function DashboardSection() {
  const [stats, setStats] = useState({ newOrders: 0, activeOrders: 0, delivered: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        orderAPI.getAll({}),
        productAPI.getAll({}),
      ]);
      const orders = ordersRes.data;
      setStats({
        newOrders: orders.filter((o: any) => o.status === 'Pending').length,
        activeOrders: orders.filter((o: any) => ['Accepted', 'Preparing', 'OutForDelivery'].includes(o.status)).length,
        delivered: orders.filter((o: any) => o.status === 'Delivered').length,
        products: productsRes.data.length,
      });
    } catch (error) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const statCards = [
    { title: 'New Orders', value: stats.newOrders, icon: 'notifications', color: '#ef4444', bg: '#fee2e2' },
    { title: 'Active Orders', value: stats.activeOrders, icon: 'timer', color: '#f59e0b', bg: '#fef3c7' },
    { title: 'Delivered', value: stats.delivered, icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5' },
    { title: 'Total Products', value: stats.products, icon: 'cube', color: '#3b82f6', bg: '#dbeafe' },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.statsGrid}>
        {statCards.map((card, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: card.bg }]}>
            <View style={[styles.statIconBox, { backgroundColor: card.color }]}>
              <Ionicons name={card.icon as any} size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Orders Section
function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = selectedStatus ? { status: selectedStatus } : {};
      const response = await orderAPI.getAll(params);
      setOrders(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      Alert.alert('Success', 'Order status updated');
      loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const statuses = ['Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'];
  const filterOptions = [{ label: 'All', value: null }, ...statuses.map(s => ({ label: s, value: s }))];

  const filteredOrders = orders.filter((order: any) => {
    if (searchQuery) {
      return (
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }
    return true;
  });

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID, Name, or Phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {filterOptions.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.filterChip, selectedStatus === option.value && styles.filterChipActive]}
            onPress={() => setSelectedStatus(option.value)}
          >
            <Text style={[styles.filterChipText, selectedStatus === option.value && styles.filterChipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <View>
          {filteredOrders.map((order: any) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderID}>#{order.orderId}</Text>
                <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
              </View>

              <View style={styles.orderInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#64748b" />
                  <Text style={styles.infoText}>{order.customerName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={16} color="#64748b" />
                  <Text style={styles.infoText}>{order.customerPhone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color="#64748b" />
                  <Text style={styles.infoText}>
                    {order.deliveryAddress?.area}, {order.deliveryAddress?.pincode}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={16} color="#64748b" />
                  <Text style={styles.infoText}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                {order.items.map((item: any, idx: number) => (
                  <Text key={idx} style={styles.itemText}>
                    • {item.productName} ({item.variant?.value}) x{item.quantity}
                  </Text>
                ))}
              </View>

              <View style={styles.statusActions}>
                <Text style={styles.statusLabel}>Update Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusBtn, order.status === status && styles.statusBtnActive]}
                      onPress={() => updateStatus(order.orderId, status)}
                    >
                      <Text style={[styles.statusBtnText, order.status === status && styles.statusBtnTextActive]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Products Section (Simplified version from before)
function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    shortDescription: '',
    fullDescription: '',
    basePrice: '',
    offerPrice: '',
    inStock: true,
    unit: '',
    images: [] as string[],
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAll({});
      setProducts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      shortDescription: '',
      fullDescription: '',
      basePrice: '',
      offerPrice: '',
      inStock: true,
      unit: '',
      images: [],
    });
    setShowForm(true);
  };

  const saveProduct = async () => {
    if (!formData.name || !formData.basePrice) {
      Alert.alert('Error', 'Name and Price are required');
      return;
    }

    const productData = {
      ...formData,
      basePrice: parseFloat(formData.basePrice),
      offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null,
    };

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct._id, productData);
        Alert.alert('Success', 'Product updated');
      } else {
        await productAPI.create(productData);
        Alert.alert('Success', 'Product added');
      }
      setShowForm(false);
      loadProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  if (showForm) {
    return (
      <View style={styles.section}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Product name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.category}
            onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
            placeholder="Category"
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.basePrice}
              onChangeText={(text) => setFormData(prev => ({ ...prev, basePrice: text }))}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Offer Price</Text>
            <TextInput
              style={styles.formInput}
              value={formData.offerPrice}
              onChangeText={(text) => setFormData(prev => ({ ...prev, offerPrice: text }))}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Unit (kg, piece, dozen, etc.)</Text>
          <TextInput
            style={styles.formInput}
            value={formData.unit}
            onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
            placeholder="kg"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Short Description</Text>
          <TextInput
            style={styles.formInput}
            value={formData.shortDescription}
            onChangeText={(text) => setFormData(prev => ({ ...prev, shortDescription: text }))}
            placeholder="Brief description"
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setFormData(prev => ({ ...prev, inStock: !prev.inStock }))}
          >
            <Text style={styles.toggleLabel}>In Stock</Text>
            <Ionicons
              name={formData.inStock ? 'toggle' : 'toggle-outline'}
              size={40}
              color={formData.inStock ? '#10b981' : '#94a3b8'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveProduct}>
          <Text style={styles.saveBtnText}>Save Product</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>

      <View style={styles.productGrid}>
        {products.map((product: any) => (
          <View key={product._id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>
            <Text style={styles.productPrice}>₹{product.basePrice}</Text>
            <Text style={[styles.productStock, !product.inStock && styles.outOfStock]}>
              {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Placeholder sections
function CategoriesSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.placeholder}>Categories Management - Coming Soon</Text>
    </View>
  );
}

function InventorySection() {
  return (
    <View style={styles.section}>
      <Text style={styles.placeholder}>Inventory & Stock Management - Coming Soon</Text>
    </View>
  );
}

function DeliverySection() {
  return (
    <View style={styles.section}>
      <Text style={styles.placeholder}>Delivery Management - Coming Soon</Text>
    </View>
  );
}

function CouponsSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.placeholder}>Coupons Management - Coming Soon</Text>
    </View>
  );
}

function CustomersSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.placeholder}>Customers Management - Coming Soon</Text>
    </View>
  );
}

function SettingsSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.placeholder}>Settings - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  loginBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 16,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  sidebarCollapsed: {
    width: 70,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  brandText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  menu: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  menuText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  contentArea: {
    flex: 1,
    padding: 24,
  },
  section: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderID: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
  orderItems: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  statusActions: {
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  statusBtnActive: {
    backgroundColor: '#2563eb',
  },
  statusBtnText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  outOfStock: {
    color: '#ef4444',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 60,
  },
});
