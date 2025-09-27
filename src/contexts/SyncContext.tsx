import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firebaseSyncService, SyncStatus } from '../services/firebaseSyncService';
import { useAuth } from './AuthContext';
import { GalleryItem } from '../types';

interface SyncContextType {
  syncStatus: SyncStatus;
  enableSync: boolean;
  toggleSync: () => void;
  forcSync: () => Promise<void>;
  enableRealtimeSync: (onItemsChanged: (items: GalleryItem[]) => void) => void;
  disableRealtimeSync: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(firebaseSyncService.getSyncStatus());
  const [enableSync, setEnableSync] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = firebaseSyncService.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Perform initial sync when user logs in and sync is enabled
    if (user && enableSync && syncStatus.isOnline && !syncStatus.isSyncing) {
      firebaseSyncService.performFullSync(user).catch(console.error);
    }
  }, [user, enableSync, syncStatus.isOnline]);

  const toggleSync = () => {
    const newEnableSync = !enableSync;
    setEnableSync(newEnableSync);
    
    if (!newEnableSync) {
      // Disable real-time sync when sync is turned off
      firebaseSyncService.disableRealtimeSync();
    }
    
    console.log(`Sync ${newEnableSync ? 'enabled' : 'disabled'}`);
  };

  const forcSync = async () => {
    if (user && enableSync) {
      try {
        await firebaseSyncService.forcSync(user);
      } catch (error) {
        console.error('Force sync failed:', error);
      }
    }
  };

  const enableRealtimeSync = (onItemsChanged: (items: GalleryItem[]) => void) => {
    if (user && enableSync) {
      firebaseSyncService.enableRealtimeSync(user, onItemsChanged);
    }
  };

  const disableRealtimeSync = () => {
    firebaseSyncService.disableRealtimeSync();
  };

  const value: SyncContextType = {
    syncStatus,
    enableSync,
    toggleSync,
    forcSync,
    enableRealtimeSync,
    disableRealtimeSync,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};