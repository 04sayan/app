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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, orderAPI, productAPI, couponAPI, pincodeAPI } from '../../utils/api';
import { storage } from '../../utils/storage';

type Tab = 'dashboard' | 'orders' | 'products' | 'customers' | 'coupons' | 'pincodes' | 'settings';

export default function AdminMain() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Check if admin is already logged in
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const adminSession = await storage.getItem('adminSession');
        if (adminSession) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Failed to check admin auth:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAdminAuth();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await adminAPI.login(username, password);
      if (response.data.success) {
        await storage.setItem('adminSession', JSON.stringify({
          username,
          token: response.data.token,
          timestamp: Date.now(),
        }));
        setIsLoggedIn(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed', 
        error.response?.data?.detail || 'Invalid credentials.\n\nDefault credentials:\nUsername: admin\nPassword: admin.1'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await storage.removeItem('adminSession');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const tabs = [
    { id: 'dashboard' as Tab, icon: 'grid-outline', label: 'Dashboard' },
    { id: 'orders' as Tab, icon: 'list-outline', label: 'Orders' },
    { id: 'products' as Tab, icon: 'cube-outline', label: 'Products' },
    { id: 'customers' as Tab, icon: 'people-outline', label: 'Customers' },
    { id: 'coupons' as Tab, icon: 'pricetag-outline', label: 'Coupons' },
    { id: 'pincodes' as Tab, icon: 'location-outline', label: 'Pincodes' },
  ];

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.loginCard}>
            <Ionicons name="shield-checkmark" size={64} color="#e63946" />
            <Text style={styles.loginTitle}>Admin Panel</Text>
            <Text style={styles.loginSubtitle}>Hatbajar Management</Text>

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
              <ActivityIndicator size="large" color="#e63946" style={styles.loader} />
            ) : (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.hintText}>Default: admin / admin.1</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hatbajar Admin</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? '#e63946' : '#666'}
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'coupons' && <CouponsTab />}
        {activeTab === 'pincodes' && <PincodesTab />}
      </View>
    </SafeAreaView>
  );
}

// Dashboard Tab
function DashboardTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    newOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    totalProducts: 0,
  });

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
        activeOrders: orders.filter((o: any) => 
          ['Accepted', 'Preparing', 'OutForDelivery'].includes(o.status)
        ).length,
        deliveredOrders: orders.filter((o: any) => o.status === 'Delivered').length,
        totalProducts: productsRes.data.length,
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
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  const statCards = [
    { title: 'New Orders', value: stats.newOrders, icon: 'notifications', color: '#ff6b6b' },
    { title: 'Active Orders', value: stats.activeOrders, icon: 'time', color: '#ffa500' },
    { title: 'Delivered', value: stats.deliveredOrders, icon: 'checkmark-circle', color: '#4CAF50' },
    { title: 'Products', value: stats.totalProducts, icon: 'cube', color: '#e63946' },
  ];

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: card.color }]}>
            <Ionicons name={card.icon as any} size={32} color={card.color} />
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statTitle}>{card.title}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Orders Tab
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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
      console.error('Failed to load orders');
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

  const statuses = ['Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered'];
  const filterStatuses = [null, ...statuses, 'Cancelled'];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filterStatuses.map((status) => (
          <TouchableOpacity
            key={status || 'all'}
            style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[styles.filterText, selectedStatus === status && styles.filterTextActive]}>
              {status || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      ) : (
        <ScrollView style={styles.tabContent}>
          {orders.map((order: any) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{order.orderId}</Text>
                <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
              </View>
              <Text style={styles.orderCustomer}>{order.customerName}</Text>
              <Text style={styles.orderPhone}>{order.customerPhone}</Text>
              <View style={styles.orderItems}>
                {order.items.map((item: any, idx: number) => (
                  <Text key={idx} style={styles.itemText}>
                    • {item.productName} {item.variant?.value} x{item.quantity}
                  </Text>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
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
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// Products Tab (Simplified - basic list)
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll({});
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionNote}>Product management coming soon</Text>
      {products.map((product: any) => (
        <View key={product._id} style={styles.productCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>₹{product.basePrice}</Text>
          <Text style={styles.productStock}>{product.inStock ? 'In Stock' : 'Out of Stock'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Customers Tab
function CustomersTab() {
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      {customers.map((customer: any) => (
        <View key={customer._id} style={styles.customerCard}>
          <Text style={styles.customerName}>{customer.name || 'No Name'}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
          <Text style={styles.customerOrders}>{customer.orderCount || 0} orders</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Coupons Tab
function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const response = await couponAPI.getAll();
      setCoupons(response.data);
    } catch (error) {
      console.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionNote}>Coupon management coming soon</Text>
      {coupons.map((coupon: any) => (
        <View key={coupon._id} style={styles.couponCard}>
          <Text style={styles.couponCode}>{coupon.code}</Text>
          <Text style={styles.couponValue}>
            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
          </Text>
          <Text style={styles.couponStatus}>{coupon.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Pincodes Tab
function PincodesTab() {
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPincodes();
  }, []);

  const loadPincodes = async () => {
    try {
      const response = await pincodeAPI.getAll();
      setPincodes(response.data);
    } catch (error) {
      console.error('Failed to load pincodes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionNote}>Pincode management coming soon</Text>
      {pincodes.map((pincode: any) => (
        <View key={pincode._id} style={styles.pincodeCard}>
          <Text style={styles.pincodeCode}>{pincode.pincode}</Text>
          <Text style={styles.pincodeArea}>{pincode.area}</Text>
          <Text style={styles.pincodeStatus}>{pincode.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#e63946',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#e63946',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabNav: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#e63946',
  },
  tabLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#e63946',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#e63946',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e63946',
  },
  orderCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  orderItems: {
    marginTop: 8,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  statusBtnActive: {
    backgroundColor: '#e63946',
  },
  statusBtnText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  sectionNote: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#e63946',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  customerOrders: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  couponValue: {
    fontSize: 14,
    color: '#e63946',
    marginTop: 4,
  },
  couponStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pincodeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pincodeCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pincodeArea: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pincodeStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
