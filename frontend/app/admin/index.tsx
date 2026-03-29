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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, orderAPI } from '../../utils/api';
import Header from '../../components/Header';
import { storage } from '../../utils/storage';

export default function Admin() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    try {
      await adminAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change password');
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await adminAPI.login(username, password);
      if (response.data.success) {
        // Save admin session
        await storage.setItem('adminSession', JSON.stringify({
          username,
          token: response.data.token,
          timestamp: Date.now(),
        }));
        setIsLoggedIn(true);
        loadOrders();
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

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = selectedStatus ? { status: selectedStatus } : {};
      const response = await orderAPI.getAll(params);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadOrders();
    }
  }, [selectedStatus, isLoggedIn]);

  const handleLogout = async () => {
    await storage.removeItem('adminSession');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      Alert.alert('Success', 'Order status updated');
      loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const statuses = ['Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered'];
  const filterStatuses = [null, 'Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'];

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Admin Login" showBack />
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

            <Text style={styles.hintText}>
              Default: admin / admin.1
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Admin Panel</Text>
        
        <View style={styles.rightActions}>
          <TouchableOpacity onPress={() => setShowChangePassword(true)} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterStatuses.map((status) => (
            <TouchableOpacity
              key={status || 'all'}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status || 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }} colors={['#e63946']} />
          }
        >
          {orders.length > 0 ? (
            orders.map((order: any) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order.orderId}</Text>
                  <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.customerPhone}>{order.customerPhone}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.orderItems}>
                  {order.items.map((item: any, index: number) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.productName} {item.variant && `(${item.variant.value})`} x{item.quantity}
                    </Text>
                  ))}
                </View>

                <View style={styles.statusSection}>
                  <Text style={styles.statusLabel}>Update Status:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {statuses.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          order.status === status && styles.statusButtonActive,
                        ]}
                        onPress={() => handleUpdateStatus(order.orderId, status)}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            order.status === status && styles.statusButtonTextActive,
                          ]}
                        >
                          {status.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e63946',
  },
  orderDetails: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  customerPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  statusSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  statusButtonActive: {
    backgroundColor: '#e63946',
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  header: {
    backgroundColor: '#e63946',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
