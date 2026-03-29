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
import { adminAPI, orderAPI, productAPI, pincodeAPI } from '../../utils/api';
import { storage } from '../../utils/storage';
import * as ImagePicker from 'expo-image-picker';

type Tab = 'dashboard' | 'orders' | 'products' | 'customers' | 'pincodes' | 'settings';

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
    { id: 'pincodes' as Tab, icon: 'location-outline', label: 'Pincodes' },
    { id: 'settings' as Tab, icon: 'settings-outline', label: 'Settings' },
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
        <Text style={styles.headerTitle}>🏪 Hatbajar Admin</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation - MVP Admin Sections */}
      <View style={styles.tabNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={22}
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
        {activeTab === 'pincodes' && <PincodesTab />}
        {activeTab === 'settings' && <SettingsTab />}
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

// Products Tab - Full CRUD
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    shortDescription: '',
    fullDescription: '',
    productType: 'weight', // 'weight' or 'pack'
    basePrice: '',
    inStock: true,
    images: [] as string[],
  });
  
  const [weightOptions, setWeightOptions] = useState([
    { value: '250g', price: '', enabled: false },
    { value: '500g', price: '', enabled: false },
    { value: '750g', price: '', enabled: false },
    { value: '1kg', price: '', enabled: false },
  ]);
  
  const [packOptions, setPackOptions] = useState([
    { value: '6 pieces', price: '', enabled: false },
    { value: '12 pieces', price: '', enabled: false },
    { value: 'tray', price: '', enabled: false },
  ]);

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
      productType: 'weight',
      basePrice: '',
      inStock: true,
      images: [],
    });
    setWeightOptions([
      { value: '250g', price: '', enabled: false },
      { value: '500g', price: '', enabled: false },
      { value: '750g', price: '', enabled: false },
      { value: '1kg', price: '', enabled: false },
    ]);
    setPackOptions([
      { value: '6 pieces', price: '', enabled: false },
      { value: '12 pieces', price: '', enabled: false },
      { value: 'tray', price: '', enabled: false },
    ]);
    setShowForm(true);
  };

  const openEditForm = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      shortDescription: product.shortDescription || '',
      fullDescription: product.fullDescription || '',
      productType: product.productType || 'weight',
      basePrice: product.basePrice?.toString() || '',
      inStock: product.inStock,
      images: product.images || [],
    });
    
    // Load variants
    if (product.variants && product.variants.length > 0) {
      if (product.productType === 'weight') {
        setWeightOptions(prev => prev.map(opt => {
          const variant = product.variants.find((v: any) => v.value === opt.value);
          return variant ? { ...opt, price: variant.price.toString(), enabled: true } : opt;
        }));
      } else {
        setPackOptions(prev => prev.map(opt => {
          const variant = product.variants.find((v: any) => v.value === opt.value);
          return variant ? { ...opt, price: variant.price.toString(), enabled: true } : opt;
        }));
      }
    }
    
    setShowForm(true);
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const base64Images = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...base64Images].slice(0, 5),
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const saveProduct = async () => {
    if (!formData.name || !formData.category) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }

    const variants = formData.productType === 'weight'
      ? weightOptions.filter(o => o.enabled).map(o => ({ value: o.value, price: parseFloat(o.price) }))
      : packOptions.filter(o => o.enabled).map(o => ({ value: o.value, price: parseFloat(o.price) }));

    const productData = {
      ...formData,
      basePrice: parseFloat(formData.basePrice) || 0,
      variants,
    };

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct._id, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await productAPI.create(productData);
        Alert.alert('Success', 'Product added successfully');
      }
      setShowForm(false);
      loadProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const deleteProduct = (productId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
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

  if (showForm) {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="e.g., Fresh Chicken"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.category}
            onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
            placeholder="e.g., Chicken, Eggs"
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
          <Text style={styles.label}>Full Description</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={formData.fullDescription}
            onChangeText={(text) => setFormData(prev => ({ ...prev, fullDescription: text }))}
            placeholder="Detailed description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Type *</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioBtn, formData.productType === 'weight' && styles.radioBtnActive]}
              onPress={() => setFormData(prev => ({ ...prev, productType: 'weight' }))}
            >
              <Text style={[styles.radioBtnText, formData.productType === 'weight' && styles.radioBtnTextActive]}>
                Weight-based
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioBtn, formData.productType === 'pack' && styles.radioBtnActive]}
              onPress={() => setFormData(prev => ({ ...prev, productType: 'pack' }))}
            >
              <Text style={[styles.radioBtnText, formData.productType === 'pack' && styles.radioBtnTextActive]}>
                Pack-based
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Base Price (₹)</Text>
          <TextInput
            style={styles.formInput}
            value={formData.basePrice}
            onChangeText={(text) => setFormData(prev => ({ ...prev, basePrice: text }))}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        {formData.productType === 'weight' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Weight Options</Text>
            {weightOptions.map((opt, idx) => (
              <View key={idx} style={styles.variantRow}>
                <TouchableOpacity
                  onPress={() => setWeightOptions(prev => prev.map((o, i) => i === idx ? { ...o, enabled: !o.enabled } : o))}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name={opt.enabled ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={opt.enabled ? '#e63946' : '#999'}
                  />
                </TouchableOpacity>
                <Text style={styles.variantLabel}>{opt.value}</Text>
                <TextInput
                  style={[styles.variantInput, !opt.enabled && styles.variantInputDisabled]}
                  value={opt.price}
                  onChangeText={(text) => setWeightOptions(prev => prev.map((o, i) => i === idx ? { ...o, price: text } : o))}
                  placeholder="Price"
                  keyboardType="numeric"
                  editable={opt.enabled}
                />
              </View>
            ))}
          </View>
        )}

        {formData.productType === 'pack' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pack Options</Text>
            {packOptions.map((opt, idx) => (
              <View key={idx} style={styles.variantRow}>
                <TouchableOpacity
                  onPress={() => setPackOptions(prev => prev.map((o, i) => i === idx ? { ...o, enabled: !o.enabled } : o))}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name={opt.enabled ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={opt.enabled ? '#e63946' : '#999'}
                  />
                </TouchableOpacity>
                <Text style={styles.variantLabel}>{opt.value}</Text>
                <TextInput
                  style={[styles.variantInput, !opt.enabled && styles.variantInputDisabled]}
                  value={opt.price}
                  onChangeText={(text) => setPackOptions(prev => prev.map((o, i) => i === idx ? { ...o, price: text } : o))}
                  placeholder="Price"
                  keyboardType="numeric"
                  editable={opt.enabled}
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Stock Status</Text>
          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => setFormData(prev => ({ ...prev, inStock: !prev.inStock }))}
          >
            <Text style={styles.switchLabel}>{formData.inStock ? 'In Stock' : 'Out of Stock'}</Text>
            <Ionicons
              name={formData.inStock ? 'toggle' : 'toggle-outline'}
              size={40}
              color={formData.inStock ? '#4CAF50' : '#999'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Images (up to 5)</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImages}>
            <Ionicons name="images-outline" size={24} color="#e63946" />
            <Text style={styles.imagePickerText}>Add Images</Text>
          </TouchableOpacity>
          <View style={styles.imageGrid}>
            {formData.images.map((img, idx) => (
              <View key={idx} style={styles.imagePreview}>
                <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(idx)}>
                  <Ionicons name="close-circle" size={24} color="#ff0000" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveProduct}>
          <Text style={styles.saveBtnText}>{editingProduct ? 'Update Product' : 'Add Product'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.addBtn} onPress={openAddForm}>
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addBtnText}>Add Product</Text>
      </TouchableOpacity>

      <ScrollView style={styles.tabContent}>
        {products.map((product: any) => (
          <View key={product._id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productPrice}>Base: ₹{product.basePrice}</Text>
                <Text style={[styles.productStock, !product.inStock && styles.productOutOfStock]}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity onPress={() => openEditForm(product)} style={styles.actionBtn}>
                  <Ionicons name="create-outline" size={20} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteProduct(product._id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={20} color="#ff0000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
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

// Pincodes Tab - Service Area Management
function PincodesTab() {
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPincode, setNewPincode] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    loadPincodes();
  }, []);

  const loadPincodes = async () => {
    setLoading(true);
    try {
      const response = await pincodeAPI.getAll();
      setPincodes(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pincodes');
    } finally {
      setLoading(false);
    }
  };

  const addPincode = async () => {
    if (!newPincode || !newArea) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await pincodeAPI.create({ pincode: newPincode, area: newArea, isActive: true });
      Alert.alert('Success', 'Pincode added successfully');
      setNewPincode('');
      setNewArea('');
      setShowAddForm(false);
      loadPincodes();
    } catch (error) {
      Alert.alert('Error', 'Failed to add pincode');
    }
  };

  const togglePincode = async (id: string, currentStatus: boolean) => {
    try {
      await pincodeAPI.update(id, { isActive: !currentStatus });
      loadPincodes();
    } catch (error) {
      Alert.alert('Error', 'Failed to update pincode');
    }
  };

  const deletePincode = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Remove this service area?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await pincodeAPI.delete(id);
              Alert.alert('Success', 'Pincode removed');
              loadPincodes();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pincode');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {showAddForm ? (
        <View style={styles.addPincodeForm}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Add Service Area</Text>
          </View>
          <TextInput
            style={styles.formInput}
            placeholder="Pincode (e.g., 560001)"
            value={newPincode}
            onChangeText={setNewPincode}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.formInput}
            placeholder="Area Name (e.g., Bangalore Central)"
            value={newArea}
            onChangeText={setNewArea}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={addPincode}>
            <Text style={styles.saveBtnText}>Add Pincode</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addBtnText}>Add Pincode</Text>
          </TouchableOpacity>

          <ScrollView style={styles.tabContent}>
            {pincodes.map((pincode: any) => (
              <View key={pincode._id} style={styles.pincodeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pincodeCode}>{pincode.pincode}</Text>
                  <Text style={styles.pincodeArea}>{pincode.area}</Text>
                  <Text style={[styles.pincodeStatus, !pincode.isActive && styles.pincodeInactive]}>
                    {pincode.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={styles.pincodeActions}>
                  <TouchableOpacity onPress={() => togglePincode(pincode._id, pincode.isActive)}>
                    <Ionicons
                      name={pincode.isActive ? 'toggle' : 'toggle-outline'}
                      size={32}
                      color={pincode.isActive ? '#4CAF50' : '#999'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deletePincode(pincode._id)} style={{ marginLeft: 12 }}>
                    <Ionicons name="trash-outline" size={20} color="#ff0000" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

// Settings Tab - Delivery Settings
function SettingsTab() {
  const [settings, setSettings] = useState({
    ordersActive: true,
    defaultDeliveryTime: '24 hours',
    deliverySlots: ['9 AM - 12 PM', '12 PM - 3 PM', '3 PM - 6 PM', '6 PM - 9 PM'],
  });

  const toggleOrders = async () => {
    setSettings(prev => ({ ...prev, ordersActive: !prev.ordersActive }));
    Alert.alert('Success', settings.ordersActive ? 'Orders paused' : 'Orders resumed');
  };

  const updateDeliveryTime = (time: string) => {
    setSettings(prev => ({ ...prev, defaultDeliveryTime: time }));
  };

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitle}>Accept New Orders</Text>
          <Text style={styles.settingDesc}>
            {settings.ordersActive ? 'Customers can place orders' : 'Order placement is paused'}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleOrders}>
          <Ionicons
            name={settings.ordersActive ? 'toggle' : 'toggle-outline'}
            size={40}
            color={settings.ordersActive ? '#4CAF50' : '#999'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>Default Delivery Time</Text>
        <View style={styles.radioGroup}>
          {['24 hours', '48 hours', 'Same day'].map(time => (
            <TouchableOpacity
              key={time}
              style={[styles.radioBtn, settings.defaultDeliveryTime === time && styles.radioBtnActive]}
              onPress={() => updateDeliveryTime(time)}
            >
              <Text style={[styles.radioBtnText, settings.defaultDeliveryTime === time && styles.radioBtnTextActive]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>Delivery Slots</Text>
        {settings.deliverySlots.map((slot, idx) => (
          <View key={idx} style={styles.slotRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.slotText}>{slot}</Text>
          </View>
        ))}
      </View>
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
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  tabActive: {
    borderBottomColor: '#e63946',
    backgroundColor: '#fff5f5',
  },
  tabLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '600',
  },
  pincodeInactive: {
    color: '#999',
  },
  pincodeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#e63946',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  radioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  radioBtnActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  radioBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  radioBtnTextActive: {
    color: '#fff',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  variantLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  variantInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 100,
  },
  variantInputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e63946',
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#e63946',
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 8,
  },
  productOutOfStock: {
    color: '#ff6b6b',
  },
  addPincodeForm: {
    padding: 16,
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  settingDesc: {
    fontSize: 13,
    color: '#666',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  slotText: {
    fontSize: 14,
    color: '#333',
  },
});
