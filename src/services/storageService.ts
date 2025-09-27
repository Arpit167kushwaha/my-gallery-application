import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, GalleryItem } from '../types';

const KEYS = {
  USER: '@user',
  GALLERY_ITEMS: '@gallery_items',
  THEME: '@theme_preference',
};

class StorageService {
  // Secure storage for sensitive data tokens user info
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Using AsyncStorage for web as SecureStore is not available
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error setting secure item:', error);
      throw error;
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error getting secure item:', error);
      return null;
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing secure item:', error);
      throw error;
    }
  }

  // Regular storage for app data
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error setting item:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  // User management
  async saveUser(user: User): Promise<void> {
    await this.setSecureItem(KEYS.USER, JSON.stringify(user));
  }

  async getUser(): Promise<User | null> {
    const userData = await this.getSecureItem(KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  }

  async removeUser(): Promise<void> {
    await this.removeSecureItem(KEYS.USER);
  }

  // Gallery items management
  async saveGalleryItems(items: GalleryItem[]): Promise<void> {
    await this.setItem(KEYS.GALLERY_ITEMS, items);
  }

  async getGalleryItems(): Promise<GalleryItem[]> {
    const items = await this.getItem<GalleryItem[]>(KEYS.GALLERY_ITEMS);
    return items || [];
  }

  async addGalleryItem(item: GalleryItem): Promise<void> {
    const items = await this.getGalleryItems();
    items.unshift(item);
    await this.saveGalleryItems(items);
  }

  async removeGalleryItem(id: string): Promise<void> {
    console.log('StorageService: removeGalleryItem called for id:', id);
    const items = await this.getGalleryItems();
    console.log('StorageService: Retrieved items count:', items.length);
    console.log('StorageService: Looking for item with id:', id);
    
    const itemExists = items.find(item => item.id === id);
    console.log('StorageService: Item exists?', !!itemExists);
    
    const filteredItems = items.filter(item => item.id !== id);
    console.log('StorageService: Filtered items count:', filteredItems.length);
    
    await this.saveGalleryItems(filteredItems);
    console.log('StorageService: Items saved successfully');
  }

  async updateGalleryItemCaption(id: string, caption: string): Promise<void> {
    const items = await this.getGalleryItems();
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, caption } : item
    );
    await this.saveGalleryItems(updatedItems);
  }

  async markItemSynced(id: string, cloudId?: string): Promise<void> {
    const items = await this.getGalleryItems();
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, synced: true, cloudId } : item
    );
    await this.saveGalleryItems(updatedItems);
  }

  async markItemUnsynced(id: string): Promise<void> {
    const items = await this.getGalleryItems();
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, synced: false, cloudId: undefined } : item
    );
    await this.saveGalleryItems(updatedItems);
  }

  // Theme preference
  async saveThemePreference(isDarkMode: boolean): Promise<void> {
    await this.setItem(KEYS.THEME, isDarkMode);
  }

  async getThemePreference(): Promise<boolean> {
    const preference = await this.getItem<boolean>(KEYS.THEME);
    return preference ?? false; // Default to light mode
  }
}

export const storageService = new StorageService();