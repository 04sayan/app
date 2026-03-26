// Fallback storage for when AsyncStorage is not available
const memoryStorage: { [key: string]: string } = {};

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Try AsyncStorage first
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.log('Using memory storage fallback for getItem');
      return memoryStorage[key] || null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.log('Using memory storage fallback for setItem');
      memoryStorage[key] = value;
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Using memory storage fallback for removeItem');
      delete memoryStorage[key];
    }
  },
};
