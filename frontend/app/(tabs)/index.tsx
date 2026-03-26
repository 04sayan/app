import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productAPI } from '../../utils/api';
import ProductCard from '../../components/ProductCard';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const customer = useAuthStore((state) => state.customer);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const [featuredRes, allRes] = await Promise.all([
        productAPI.getAll({ featured: true, inStock: true }),
        productAPI.getAll({ inStock: true }),
      ]);
      
      setFeaturedProducts(featuredRes.data.slice(0, 4));
      setAllProducts(allRes.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const categories = [
    { id: 'chicken', name: 'Chicken', icon: 'fast-food', color: '#ff6b6b' },
    { id: 'eggs', name: 'Eggs', icon: 'egg', color: '#ffd93d' },
    { id: 'fish', name: 'Fish', icon: 'fish', color: '#6bcfff', comingSoon: true },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello{customer?.name ? `, ${customer.name}` : ''}!</Text>
          <Text style={styles.subtitle}>Fresh products delivered to your door</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e63946']} />
          }
        >
          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Fresh & Hygienic</Text>
              <Text style={styles.bannerSubtitle}>100% Farm Fresh Products</Text>
              <TouchableOpacity style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => {
                    if (category.comingSoon) return;
                    router.push({
                      pathname: '/categories',
                      params: { category: category.id },
                    });
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={32} color="#fff" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.comingSoon && (
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <TouchableOpacity onPress={() => router.push('/categories')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.productsGrid}>
                {featuredProducts.map((product) => (
                  <View key={product._id} style={styles.productItem}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trust Section */}
          <View style={styles.trustSection}>
            <Text style={styles.trustTitle}>Why Choose Hatbajar?</Text>
            <View style={styles.trustItems}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={32} color="#e63946" />
                <Text style={styles.trustItemTitle}>100% Fresh</Text>
                <Text style={styles.trustItemText}>Farm to door in hours</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="flash" size={32} color="#e63946" />
                <Text style={styles.trustItemTitle}>Fast Delivery</Text>
                <Text style={styles.trustItemText}>Same day delivery</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="card" size={32} color="#e63946" />
                <Text style={styles.trustItemTitle}>Easy Payment</Text>
                <Text style={styles.trustItemText}>COD & UPI available</Text>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    margin: 16,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e63946',
  },
  bannerContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
  bannerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  bannerButtonText: {
    color: '#e63946',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  seeAll: {
    color: '#e63946',
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  productItem: {
    width: '50%',
    paddingHorizontal: 8,
  },
  trustSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 12,
  },
  trustTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  trustItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  trustItemText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
