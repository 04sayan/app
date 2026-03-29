import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Header from '../components/Header';
import { useAuthStore } from '../store/authStore';
import { addressAPI, pincodeAPI } from '../utils/api';

export default function Addresses() {
  const router = useRouter();
  const customer = useAuthStore((state) => state.customer);
  
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Form fields
  const [fullAddress, setFullAddress] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    if (!customer) return;
    
    try {
      const response = await addressAPI.getCustomerAddresses(customer.phone);
      setAddresses(response.data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
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
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const resetForm = () => {
    setFullAddress('');
    setArea('');
    setLandmark('');
    setPincode('');
    setLatitude(null);
    setLongitude(null);
    setIsDefault(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!fullAddress || !area || !pincode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (pincode.length !== 6) {
      Alert.alert('Error', 'Please enter valid 6-digit pincode');
      return;
    }

    if (!customer) return;

    setSaving(true);
    try {
      const addressData = {
        customerPhone: customer.phone,
        fullAddress,
        area,
        landmark,
        pincode,
        latitude,
        longitude,
        isDefault,
      };

      if (editingId) {
        await addressAPI.update(editingId, addressData);
        Alert.alert('Success', 'Address updated successfully');
      } else {
        await addressAPI.create(addressData);
        Alert.alert('Success', 'Address added successfully');
      }

      resetForm();
      setShowForm(false);
      loadAddresses();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address: any) => {
    setFullAddress(address.fullAddress);
    setArea(address.area);
    setLandmark(address.landmark || '');
    setPincode(address.pincode);
    setLatitude(address.latitude);
    setLongitude(address.longitude);
    setIsDefault(address.isDefault);
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressAPI.delete(addressId);
              Alert.alert('Success', 'Address deleted');
              loadAddresses();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Manage Addresses" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Manage Addresses" showBack />
      
      {!showForm ? (
        <>
          <ScrollView style={styles.scrollView}>
            {addresses.length > 0 ? (
              addresses.map((address: any) => (
                <View key={address._id} style={styles.addressCard}>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                  
                  <Text style={styles.addressText}>{address.fullAddress}</Text>
                  <Text style={styles.addressDetail}>
                    {address.area}, {address.pincode}
                  </Text>
                  {address.landmark && (
                    <Text style={styles.addressDetail}>Landmark: {address.landmark}</Text>
                  )}

                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(address)}
                    >
                      <Ionicons name="create-outline" size={18} color="#e63946" />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(address._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#e63946" />
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>No saved addresses</Text>
                <Text style={styles.emptySubtext}>Add your first delivery address</Text>
              </View>
            )}
          </ScrollView>

          {addresses.length < 5 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </Text>

              <View style={styles.locationRow}>
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
                        name={latitude ? 'checkmark-circle' : 'location'}
                        size={18}
                        color={latitude ? '#4CAF50' : '#e63946'}
                      />
                      <Text style={styles.locationButtonText}>
                        {latitude ? 'Location Captured' : 'Get Live Location'}
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
                placeholder="Area / Locality *"
                value={area}
                onChangeText={setArea}
              />

              <TextInput
                style={styles.input}
                placeholder="Landmark (Optional)"
                value={landmark}
                onChangeText={setLandmark}
              />

              <TextInput
                style={styles.input}
                placeholder="Pincode *"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={styles.defaultCheckbox}
                onPress={() => setIsDefault(!isDefault)}
              >
                <Ionicons
                  name={isDefault ? 'checkbox' : 'square-outline'}
                  size={24}
                  color="#e63946"
                />
                <Text style={styles.defaultLabel}>Set as default address</Text>
              </TouchableOpacity>

              <View style={styles.formActions}>
                {saving ? (
                  <ActivityIndicator size="large" color="#e63946" />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                      <Text style={styles.saveButtonText}>Save Address</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  addressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  defaultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    paddingRight: 60,
  },
  addressDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#e63946',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#e63946',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  locationRow: {
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e63946',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#e63946',
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  defaultCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  defaultLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e63946',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#e63946',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#e63946',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
