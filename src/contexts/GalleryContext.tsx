import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GalleryContextType, GalleryItem } from '../types';
import { storageService } from '../services/storageService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { useAuth } from './AuthContext';

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

interface GalleryProviderProps {
  children: ReactNode;
}

export const GalleryProvider: React.FC<GalleryProviderProps> = ({ children }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadItems();
    } else {
      setItems([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const galleryItems = await storageService.getGalleryItems();
      // Filter items by current user
      const userItems = user ? galleryItems.filter(item => item.userId === user.id) : [];
      setItems(userItems);
    } catch (error) {
      console.error('Error loading gallery items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (uri: string, caption: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to add items');
    }

    try {
      const newItem: GalleryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uri,
        caption,
        timestamp: Date.now(),
        userId: user.id,
        synced: false,
      };


      await storageService.addGalleryItem(newItem);
      setItems(prevItems => [newItem, ...prevItems]);

      // Try to sync to Firebase in background
      try {
        const cloudId = await firebaseSyncService.uploadGalleryItem(newItem, user);
        await storageService.markItemSynced(newItem.id, cloudId);
        
        // Update local state to reflect sync status
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === newItem.id ? { ...item, synced: true, cloudId } : item
          )
        );
      } catch (syncError) {
        console.log('Background sync failed, will retry later:', syncError);
        // Item remains unsynced and will be picked up in next sync
      }
    } catch (error) {
      console.error('Error adding gallery item:', error);
      throw error;
    }
  };

  const removeItem = async (id: string): Promise<void> => {
    try {
      console.log('GalleryContext: Starting removeItem for id:', id);
      
      // Remove from local storage first
      console.log('Removing from local storage...');
      await storageService.removeGalleryItem(id);
      console.log('Removed from local storage successfully');

      console.log('Updating local state...');
      setItems(prevItems => {
        const filtered = prevItems.filter(item => item.id !== id);
        console.log('Items before filter:', prevItems.length);
        console.log('Items after filter:', filtered.length);
        return filtered;
      });
      console.log('Local state updated successfully');

      // Try to remove from Firebase in background
      try {
        console.log('Attempting Firebase sync delete...');
        await firebaseSyncService.deleteGalleryItem(id);
        console.log('Firebase delete successful');
      } catch (syncError) {
        console.log('Background delete sync failed:', syncError);
        // Could implement a deletion queue for offline scenarios
      }
    } catch (error) {
      console.error('Error removing gallery item:', error);
      throw error;
    }
  };

  const updateCaption = async (id: string, caption: string): Promise<void> => {
    try {
      // Update local storage first
      await storageService.updateGalleryItemCaption(id, caption);
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === id ? { ...item, caption, synced: false } : item
        )
      );

      // Try to sync update to Firebase in background
      try {
        await firebaseSyncService.updateGalleryItem(id, { caption });
        await storageService.markItemSynced(id);
        
        // Update sync status in local state
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === id ? { ...item, synced: true } : item
          )
        );
      } catch (syncError) {
        console.log('Background update sync failed, will retry later:', syncError);
        // Item remains unsynced and will be picked up in next sync
      }
    } catch (error) {
      console.error('Error updating caption:', error);
      throw error;
    }
  };

  const refreshItems = async (): Promise<void> => {
    // Reload local items first
    await loadItems();
    
    // Try to perform full sync in background if user is available
    if (user) {
      try {
        await firebaseSyncService.performFullSync(user);
        // Reload after sync
        await loadItems();
      } catch (error) {
        console.log('Background sync during refresh failed:', error);
      }
    }
  };

  const value: GalleryContextType = {
    items,
    isLoading,
    addItem,
    removeItem,
    updateCaption,
    refreshItems,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = (): GalleryContextType => {
  const context = useContext(GalleryContext);
  if (context === undefined) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};