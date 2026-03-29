import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI, productAPI, adminAPI } from '../../utils/api';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    newOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    totalProducts: 0,
    ordersActive: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
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
        ordersActive: true,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const statCards = [
    { title: 'New Orders', value: stats.newOrders, icon: 'notifications', color: '#ff6b6b' },
    { title: 'Active Orders', value: stats.activeOrders, icon: 'time', color: '#ffa500' },
    { title: 'Delivered', value: stats.deliveredOrders, icon: 'checkmark-circle', color: '#4CAF50' },
    { title: 'Products', value: stats.totalProducts, icon: 'cube', color: '#e63946' },
  ];

  const quickActions = [
    { title: 'View Orders', icon: 'list', route: '/admin/orders', color: '#e63946' },
    { title: 'Manage Products', icon: 'cube', route: '/admin/products', color: '#4CAF50' },
    { title: 'Coupons', icon: 'pricetag', route: '/admin/coupons', color: '#ffa500' },
    { title: 'Pincodes', icon: 'location', route: '/admin/pincodes', color: '#2196F3' },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadStats();
          }} colors={['#e63946']} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Hatbajar Admin</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <View key={index} style={[styles.statCard, { borderLeftColor: card.color }]}>
              <View style={[styles.statIcon, { backgroundColor: card.color + '20' }]}>
                <Ionicons name={card.icon as any} size={24} color={card.color} />
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statTitle}>{card.title}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={28} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
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
  header: {
    backgroundColor: '#e63946',
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
