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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { orderAPI, slotAPI, pincodeAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Header from '../components/Header';

export default function Checkout() {
  const router = useRouter();
  const customer = useAuthStore((state) => state.customer);
  const { servicePincode, setPincodeChecked } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();
  
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [location, setLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeValid, setPincodeValid] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  
  // Address fields
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [fullAddress, setFullAddress] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState(servicePincode || '');

  useEffect(() => {
    loadSlots();
    if (servicePincode) {
      setPincode(servicePincode);
      setPincodeValid(true);
    }
  }, []);

  const loadSlots = async () => {
    try {
      const response = await slotAPI.getAll();
      setSlots(response.data);
      if (response.data.length > 0) {
        setSelectedSlot(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const handleCheckPincode = async () => {
    if (pincode.length !== 6) {
      Alert.alert('Error', 'Please enter valid 6-digit pincode');
      return;
    }

    setCheckingPincode(true);
    try {
      const response = await pincodeAPI.check(pincode);
      
      if (response.data.serviceable) {
        setPincodeValid(true);
        await setPincodeChecked(true, pincode);
        Alert.alert('Success', `We deliver to ${response.data.area || 'your area'}!`);
      } else {
        setPincodeValid(false);
        Alert.alert(
          'Not Serviceable',
          'Coming Soon in Your Area. We are expanding our service to your location.',
          [
            {
              text: 'Request Service',
              onPress: async () => {
                try {
                  await pincodeAPI.request({
                    pincode,
                    customerPhone: customer?.phone || phone,
                  });
                  Alert.alert('Request Submitted', 'We will notify you when service is available.');
                } catch (error) {
                  Alert.alert('Error', 'Failed to submit request');
                }
              },
            },
            { text: 'Try Another Pincode', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check pincode');
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!pincodeValid) {
      Alert.alert('Pincode Required', 'Please verify your delivery pincode first');
      return;
    }

    if (!name || !phone || !fullAddress || !area || !pincode) {
      Alert.alert('Error', 'Please fill all address fields');
      return;
    }

    if (pincode.length !== 6) {
      Alert.alert('Error', 'Please enter valid 6-digit pincode');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerPhone: customer?.phone || phone,
        customerName: name,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variant: item.variant,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: getTotal(),
        deliveryAddress: {
          fullAddress,
          area,
          landmark,
          pincode,
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
        paymentMethod,
        deliverySlot: selectedSlot?._id,
        discount: 0,
      };

      const response = await orderAPI.create(orderData);
      
      await clearCart();
      
      Alert.alert(
        'Order Placed!',
        `Your order ${response.data.orderId} has been placed successfully`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Checkout" showBack />
      
      <ScrollView style={styles.scrollView}>
        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#e63946" />
              ) : (
                <>
                  <Ionicons
                    name={location ? 'checkmark-circle' : 'location'}
                    size={18}
                    color={location ? '#4CAF50' : '#e63946'}
                  />
                  <Text style={styles.locationButtonText}>
                    {location ? 'Location Captured' : 'Get Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Full Address *"
            value={fullAddress}
            onChangeText={setFullAddress}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={styles.input}
            placeholder="Area *"
            value={area}
            onChangeText={setArea}
          />
          <TextInput
            style={styles.input}
            placeholder="Landmark"
            value={landmark}
            onChangeText={setLandmark}
          />
          <View style={styles.pincodeRow}>
            <TextInput
              style={[styles.input, styles.pincodeInput]}
              placeholder="Pincode *"
              value={pincode}
              onChangeText={(text) => {
                setPincode(text);
                setPincodeValid(false);
              }}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[
                styles.checkPincodeButton,
                pincodeValid && styles.checkPincodeButtonValid,
              ]}
              onPress={handleCheckPincode}
              disabled={checkingPincode}
            >
              {checkingPincode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={pincodeValid ? 'checkmark-circle' : 'search'}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.checkPincodeButtonText}>
                    {pincodeValid ? 'Verified' : 'Check'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Slot */}
        {slots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Slot</Text>
            {slots.map((slot: any) => (
              <TouchableOpacity
                key={slot._id}
                style={[
                  styles.slotChip,
                  selectedSlot?._id === slot._id && styles.slotChipActive,
                ]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Ionicons
                  name={selectedSlot?._id === slot._id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedSlot?._id === slot._id ? '#e63946' : '#999'}
                />
                <Text style={styles.slotText}>{slot.slotName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentChip,
              paymentMethod === 'COD' && styles.paymentChipActive,
            ]}
            onPress={() => setPaymentMethod('COD')}
          >
            <Ionicons
              name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'COD' ? '#e63946' : '#999'}
            />
            <View style={styles.paymentContent}>
              <Text style={styles.paymentText}>Cash on Delivery</Text>
              <Text style={styles.paymentSubtext}>Pay when you receive</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentChip,
              paymentMethod === 'UPI' && styles.paymentChipActive,
            ]}
            onPress={() => setPaymentMethod('UPI')}
          >
            <Ionicons
              name={paymentMethod === 'UPI' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'UPI' ? '#e63946' : '#999'}
            />
            <View style={styles.paymentContent}>
              <Text style={styles.paymentText}>UPI</Text>
              <Text style={styles.paymentSubtext}>Mock payment (auto success)</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.orderItemName}>
                {item.productName} {item.variant && `(${item.variant.value})`}
              </Text>
              <Text style={styles.orderItemPrice}>
                {item.quantity} x ₹{item.price} = ₹{item.quantity * item.price}
              </Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{getTotal().toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderButtonText}>Place Order - ₹{getTotal()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e63946',
  },
  locationButtonText: {
    fontSize: 12,
    color: '#e63946',
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pincodeInput: {
    flex: 1,
    marginBottom: 0,
  },
  checkPincodeButton: {
    backgroundColor: '#e63946',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  checkPincodeButtonValid: {
    backgroundColor: '#4CAF50',
  },
  checkPincodeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  slotChipActive: {
    borderColor: '#e63946',
    backgroundColor: '#fee',
  },
  slotText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  paymentChipActive: {
    borderColor: '#e63946',
    backgroundColor: '#fee',
  },
  paymentContent: {
    marginLeft: 12,
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e63946',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    backgroundColor: '#e63946',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
