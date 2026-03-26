import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for stores to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)');
      }
    };

    checkAuth();
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e63946" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
