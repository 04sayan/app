import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../utils/api';
import Header from '../components/Header';

export default function OrderDetail() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await orderAPI.getById(orderId as string);
      setOrder(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#ffa500';
      case 'Accepted': return '#4CAF50';
      case 'Preparing': return '#2196F3';
      case 'OutForDelivery': return '#9C27B0';
      case 'Delivered': return '#4CAF50';
      case 'Cancelled': return '#f44336';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Order Details" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Order Details" showBack />
      
      <ScrollView style={styles.scrollView}>
        {/* Order Header */}
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>#{order.orderId}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>
                {order.status.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>
                  {item.productName}
                  {item.variant && ` (${item.variant.value})`}
                </Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{order.totalAmount - order.discount}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Discount {order.couponCode && `(${order.couponCode})`}
              </Text>
              <Text style={[styles.priceValue, styles.discountText]}>-₹{order.discount}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location" size={20} color="#e63946" />
            <View style={styles.addressText}>
              <Text style={styles.address}>{order.deliveryAddress.fullAddress}</Text>
              <Text style={styles.addressDetail}>
                {order.deliveryAddress.area}, {order.deliveryAddress.pincode}
              </Text>
              {order.deliveryAddress.landmark && (
                <Text style={styles.addressDetail}>
                  Landmark: {order.deliveryAddress.landmark}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={18} color="#666" />
            <Text style={styles.detailText}>{order.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={18} color="#666" />
            <Text style={styles.detailText}>{order.customerPhone}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.detailRow}>
            <Ionicons 
              name={order.paymentMethod === 'COD' ? 'cash-outline' : 'card-outline'} 
              size={18} 
              color="#666" 
            />
            <Text style={styles.detailText}>
              {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#666" />
            <Text style={styles.detailText}>
              Payment Status: {order.paymentStatus}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  discountText: {
    color: '#4CAF50',
  },
  totalRow: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e63946',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    marginLeft: 12,
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  addressDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
});
