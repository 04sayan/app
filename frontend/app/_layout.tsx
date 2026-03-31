import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const loadCart = useCartStore((state) => state.loadCart);

  useEffect(() => {
    loadAuth();
    loadCart();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="pincode-check" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}
