import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pincodeAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function PincodeCheck() {
  const router = useRouter();
  const { customer, setPincodeChecked } = useAuthStore();
  
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [notServiceable, setNotServiceable] = useState(false);

  const handleCheckPincode = async () => {
    if (pincode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    try {
      const response = await pincodeAPI.check(pincode);
      
      if (response.data.serviceable) {
        await setPincodeChecked(true, pincode);
        router.replace('/(tabs)');
      } else {
        setNotServiceable(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check pincode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      await pincodeAPI.request({
        pincode,
        customerPhone: customer.phone,
      });
      Alert.alert(
        'Request Submitted',
        'Thank you! We will notify you when service is available in your area.',
        [{ text: 'OK', onPress: () => setPincode('') }]
      );
      setNotServiceable(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="location" size={64} color="#e63946" />
          <Text style={styles.title}>Check Service Availability</Text>
          <Text style={styles.subtitle}>
            Enter your pincode to check if we deliver to your area
          </Text>
        </View>

        {!notServiceable ? (
          <View style={styles.form}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit pincode"
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />

            {loading ? (
              <ActivityIndicator size="large" color="#e63946" style={styles.loader} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleCheckPincode}>
                <Text style={styles.buttonText}>Check Availability</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.notServiceableContainer}>
            <Ionicons name="sad-outline" size={48} color="#e63946" />
            <Text style={styles.notServiceableTitle}>
              Coming Soon in Your Area
            </Text>
            <Text style={styles.notServiceableText}>
              We are expanding our service to your location. Would you like us to notify you?
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#e63946" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.button} onPress={handleRequestService}>
                  <Text style={styles.buttonText}>Notify Me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setNotServiceable(false);
                    setPincode('');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Try Another Pincode</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e63946',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e63946',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#e63946',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 24,
  },
  notServiceableContainer: {
    alignItems: 'center',
  },
  notServiceableTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  notServiceableText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
});
