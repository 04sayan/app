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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, orderAPI, productAPI, couponAPI, pincodeAPI } from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';

type Section = 'dashboard' | 'products' | 'categories' | 'inventory' | 'orders' | 'delivery' | 'coupons' | 'customers' | 'settings';

// Default Admin Credentials
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123'
};

export default function HatbajarAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoginLoading(true);
    
    try {
      // Check default credentials first
      if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
        setIsLoggedIn(true);
        setLoginLoading(false);
        return;
      }

      // Try backend authentication
      const response = await adminAPI.login(username, password);
      if (response.data.success) {
        setIsLoggedIn(true);
      } else {
        Alert.alert('Login Failed', 'Invalid credentials\n\nDefault: admin / admin123');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials\n\nDefault: admin / admin123');
    } finally {
      setLoginLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard' as Section, icon: 'stats-chart', label: 'Dashboard' },
    { id: 'products' as Section, icon: 'cube', label: 'Products' },
    { id: 'categories' as Section, icon: 'list', label: 'Categories' },
    { id: 'inventory' as Section, icon: 'archive', label: 'Inventory' },
    { id: 'orders' as Section, icon: 'receipt', label: 'Orders' },
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
            <View style={styles.logoBox}>
              <Ionicons name="storefront" size={48} color="#10b981" />
            </View>
            <Text style={styles.loginTitle}>Hatbajar Admin Portal</Text>
            <Text style={styles.loginSubtitle}>Management Dashboard</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="admin"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {loginLoading ? (
            <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login to Dashboard</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.defaultCreds}>Default: admin / admin123</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainLayout}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Ionicons name="storefront" size={32} color="#10b981" />
            <Text style={styles.brandName}>Hatbajar</Text>
            <Text style={styles.brandSubtitle}>Admin Panel</Text>
          </View>

          <ScrollView style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, activeSection === item.id && styles.menuItemActive]}
                onPress={() => setActiveSection(item.id)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={activeSection === item.id ? '#10b981' : '#6b7280'}
                />
                <Text style={[styles.menuLabel, activeSection === item.id && styles.menuLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              setIsLoggedIn(false);
              setUsername('');
              setPassword('');
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.contentArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.pageTitle}>
              {menuItems.find(m => m.id === activeSection)?.label}
            </Text>
            <View style={styles.topBarRight}>
              <Text style={styles.adminEmail}>{username}</Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent}>
            <View style={styles.contentInner}>
              {activeSection === 'dashboard' && <DashboardSection />}
              {activeSection === 'products' && <ProductsSection />}
              {activeSection === 'categories' && <CategoriesSection />}
              {activeSection === 'inventory' && <InventorySection />}
              {activeSection === 'orders' && <OrdersSection />}
              {activeSection === 'delivery' && <DeliverySection />}
              {activeSection === 'coupons' && <CouponsSection />}
              {activeSection === 'customers' && <CustomersSection />}
              {activeSection === 'settings' && <SettingsSection />}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Dashboard Section
function DashboardSection() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        orderAPI.getAll({}),
        productAPI.getAll({}),
      ]);

      const orders = ordersRes.data;
      const totalSales = orders
        .filter((o: any) => o.status === 'Delivered')
        .reduce((sum: number, o: any) => sum + o.totalAmount, 0);

      setStats({
        totalOrders: orders.length,
        totalSales,
        pendingOrders: orders.filter((o: any) => o.status === 'Pending').length,
        deliveredOrders: orders.filter((o: any) => o.status === 'Delivered').length,
        lowStockProducts: productsRes.data.filter((p: any) => !p.inStock).length,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerView}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: 'receipt', color: '#10b981' },
    { label: 'Total Sales', value: `₹${stats.totalSales}`, icon: 'cash', color: '#3b82f6' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: 'time', color: '#f59e0b' },
    { label: 'Delivered', value: stats.deliveredOrders, icon: 'checkmark-circle', color: '#10b981' },
    { label: 'Low Stock', value: stats.lowStockProducts, icon: 'warning', color: '#ef4444' },
  ];

  return (
    <View>
      <View style={styles.statsRow}>
        {statCards.map((card, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: card.color + '20' }]}>
              <Ionicons name={card.icon as any} size={28} color={card.color} />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Orders</Text>
        {recentOrders.map((order: any) => (
          <View key={order._id} style={styles.recentOrderRow}>
            <Text style={styles.recentOrderId}>#{order.orderId}</Text>
            <Text style={styles.recentOrderCustomer}>{order.customerName}</Text>
            <Text style={styles.recentOrderAmount}>₹{order.totalAmount}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(order.status) }]}>
                {order.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Products Section
function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    unit: 'kg',
    basePrice: '',
    offerPrice: '',
    stockQuantity: '',
    inStock: true,
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
      description: '',
      unit: 'kg',
      basePrice: '',
      offerPrice: '',
      stockQuantity: '',
      inStock: true,
      images: [],
    });
    setShowAddForm(true);
  };

  const openEditForm = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.fullDescription || '',
      unit: product.unit || 'kg',
      basePrice: product.basePrice?.toString() || '',
      offerPrice: product.offerPrice?.toString() || '',
      stockQuantity: product.stockQuantity?.toString() || '0',
      inStock: product.inStock,
      images: product.images || [],
    });
    setShowAddForm(true);
  };

  const saveProduct = async () => {
    if (!formData.name || !formData.basePrice) {
      Alert.alert('Error', 'Product name and price are required');
      return;
    }

    const productData = {
      ...formData,
      basePrice: parseFloat(formData.basePrice),
      offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null,
      stockQuantity: parseInt(formData.stockQuantity) || 0,
    };

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct._id, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await productAPI.create(productData);
        Alert.alert('Success', 'Product added successfully');
      }
      setShowAddForm(false);
      loadProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const deleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productAPI.delete(productId);
              Alert.alert('Success', 'Product deleted');
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (showAddForm) {
    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowAddForm(false)}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.formHeaderTitle}>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </Text>
        </View>

        <ScrollView>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter product name"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formCol, { marginRight: 12 }]}>
              <Text style={styles.formLabel}>Category *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.category}
                onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                placeholder="e.g., Chicken, Eggs"
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>Unit</Text>
              <TextInput
                style={styles.formInput}
                value={formData.unit}
                onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
                placeholder="kg, piece, dozen"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formCol, { marginRight: 12 }]}>
              <Text style={styles.formLabel}>Regular Price (₹) *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.basePrice}
                onChangeText={(text) => setFormData(prev => ({ ...prev, basePrice: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>Offer Price (₹)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.offerPrice}
                onChangeText={(text) => setFormData(prev => ({ ...prev, offerPrice: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>Stock Quantity</Text>
              <TextInput
                style={styles.formInput}
                value={formData.stockQuantity}
                onChangeText={(text) => setFormData(prev => ({ ...prev, stockQuantity: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setFormData(prev => ({ ...prev, inStock: !prev.inStock }))}
            >
              <Text style={styles.toggleLabel}>Product Available</Text>
              <Ionicons
                name={formData.inStock ? 'toggle' : 'toggle-outline'}
                size={48}
                color={formData.inStock ? '#10b981' : '#9ca3af'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveProduct}>
            <Text style={styles.saveButtonText}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerView}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Product</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Category</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Price</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Stock</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Actions</Text>
        </View>
        {products.map((product: any) => (
          <View key={product._id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{product.name}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{product.category}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>₹{product.basePrice}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{product.stockQuantity || 0}</Text>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text style={[styles.stockStatus, product.inStock ? styles.inStock : styles.outOfStock]}>
                {product.inStock ? 'Available' : 'Out of Stock'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8 }]}>
              <TouchableOpacity onPress={() => openEditForm(product)}>
                <Ionicons name="create" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteProduct(product._id, product.name)}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await orderAPI.getAll(params);
      setOrders(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      Alert.alert('Success', 'Order status updated');
      loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const statuses = ['Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'];
  const filterOptions = [
    { label: 'All Orders', value: null },
    ...statuses.map(s => ({ label: s, value: s }))
  ];

  const filteredOrders = orders.filter((order: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderId.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerPhone.includes(query)
    );
  });

  return (
    <View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID, Name, or Phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {filterOptions.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.filterButton, filterStatus === option.value && styles.filterButtonActive]}
            onPress={() => setFilterStatus(option.value)}
          >
            <Text style={[styles.filterButtonText, filterStatus === option.value && styles.filterButtonTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerView}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <View>
          {filteredOrders.map((order: any) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <View>
                  <Text style={styles.orderIdText}>Order #{order.orderId}</Text>
                  <Text style={styles.orderDateText}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.orderAmountText}>₹{order.totalAmount}</Text>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.orderDetailRow}>
                  <Ionicons name="person" size={16} color="#6b7280" />
                  <Text style={styles.orderDetailText}>{order.customerName}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Ionicons name="call" size={16} color="#6b7280" />
                  <Text style={styles.orderDetailText}>{order.customerPhone}</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Ionicons name="location" size={16} color="#6b7280" />
                  <Text style={styles.orderDetailText}>
                    {order.deliveryAddress?.area}, {order.deliveryAddress?.pincode}
                  </Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                <Text style={styles.orderItemsTitle}>Items:</Text>
                {order.items.map((item: any, idx: number) => (
                  <Text key={idx} style={styles.orderItemText}>
                    • {item.productName} ({item.variant?.value}) x{item.quantity}
                  </Text>
                ))}
              </View>

              <View style={styles.statusUpdateRow}>
                <Text style={styles.statusUpdateLabel}>Update Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusUpdateBtn,
                        order.status === status && styles.statusUpdateBtnActive
                      ]}
                      onPress={() => updateOrderStatus(order.orderId, status)}
                    >
                      <Text style={[
                        styles.statusUpdateBtnText,
                        order.status === status && styles.statusUpdateBtnTextActive
                      ]}>
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

// Placeholder sections for other features
function CategoriesSection() {
  return (
    <View style={styles.placeholderSection}>
      <Ionicons name="list-outline" size={64} color="#10b981" />
      <Text style={styles.placeholderTitle}>Categories Management</Text>
      <Text style={styles.placeholderText}>
        Categories can be managed through the Products section by adding category names when creating products.
      </Text>
    </View>
  );
}

function InventorySection() {
  return (
    <View style={styles.placeholderSection}>
      <Ionicons name="archive-outline" size={64} color="#10b981" />
      <Text style={styles.placeholderTitle}>Inventory & Stock</Text>
      <Text style={styles.placeholderText}>
        Stock quantities can be managed in the Products section. Update stock when editing products.
      </Text>
    </View>
  );
}

function DeliverySection() {
  return (
    <View style={styles.placeholderSection}>
      <Ionicons name="car-outline" size={64} color="#10b981" />
      <Text style={styles.placeholderTitle}>Delivery Management</Text>
      <Text style={styles.placeholderText}>
        Track delivery status through the Orders section. Update order status to manage deliveries.
      </Text>
    </View>
  );
}

function CouponsSection() {
  return (
    <View style={styles.placeholderSection}>
      <Ionicons name="pricetag-outline" size={64} color="#10b981" />
      <Text style={styles.placeholderTitle}>Coupons Management</Text>
      <Text style={styles.placeholderText}>
        Coupon management feature will be available soon. Contact support for coupon setup assistance.
      </Text>
    </View>
  );
}

function CustomersSection() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await adminAPI.getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerView}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Customer Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Phone</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Total Orders</Text>
        </View>
        {customers.map((customer: any) => (
          <View key={customer._id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{customer.name || 'Guest'}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{customer.phone}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{customer.orderCount || 0}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SettingsSection() {
  return (
    <View style={styles.placeholderSection}>
      <Ionicons name="settings-outline" size={64} color="#10b981" />
      <Text style={styles.placeholderTitle}>Settings</Text>
      <Text style={styles.placeholderText}>
        App settings and configuration options will be available here.
      </Text>
    </View>
  );
}

// Helper function
function getStatusColor(status: string) {
  const colors: any = {
    Pending: '#f59e0b',
    Accepted: '#3b82f6',
    Preparing: '#8b5cf6',
    OutForDelivery: '#06b6d4',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
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
  logoBox: {
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#000',
  },
  loginButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultCreds: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 12,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  menuList: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#d1fae5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  menuLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  logoutText: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminEmail: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  contentInner: {
    padding: 32,
  },
  centerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '18%',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  recentOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recentOrderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    width: 100,
  },
  recentOrderCustomer: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  recentOrderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    width: 80,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#000',
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inStock: {
    backgroundColor: '#d1fae5',
    color: '#10b981',
  },
  outOfStock: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  formHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formCol: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    color: '#000',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchRow: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  orderDateText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  orderAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  orderDetails: {
    marginBottom: 16,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#000',
  },
  orderItems: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  orderItemsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  orderItemText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusUpdateRow: {
    marginTop: 8,
  },
  statusUpdateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  statusUpdateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  statusUpdateBtnActive: {
    backgroundColor: '#10b981',
  },
  statusUpdateBtnText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusUpdateBtnTextActive: {
    color: '#fff',
  },
  placeholderSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
