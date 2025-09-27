import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebaseConfig';
import { GalleryItem, User } from '../types';
import { storageService } from './storageService';
import { Platform } from 'react-native';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingUploads: number;
  pendingDownloads: number;
  error: string | null;
}

export interface FirebaseGalleryItem extends Omit<GalleryItem, 'uri'> {
  cloudUri?: string;
  localUri?: string;
  synced: boolean;
  cloudId?: string;
  lastModified: Timestamp;
}

class FirebaseSyncService {
  private isInitialized = false;
  private unsubscribeRealtimeSync: (() => void) | null = null;
  private syncStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    error: null
  };
  private statusListeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {

      if (Platform.OS === 'web') {
        this.syncStatus.isOnline = navigator.onLine;
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
      }
      
      this.isInitialized = true;
      console.log('Firebase Sync Service initialized');
    } catch (error) {
      console.error('Error initializing Firebase Sync Service:', error);
      this.updateSyncStatus({ error: 'Failed to initialize sync service' });
    }
  }

  // Status management
  private updateSyncStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.statusListeners.forEach(listener => listener(this.syncStatus));
  }

  public onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  private handleConnectionChange(isOnline: boolean) {
    this.updateSyncStatus({ isOnline });
    if (isOnline) {
      // Auto-sync when coming back online
      this.performFullSync().catch(console.error);
    }
  }

  // Image upload to Firebase Storage
  private async uploadImageToStorage(localUri: string, itemId: string): Promise<string> {
    try {
      console.log('Uploading image to Firebase Storage...', itemId);
      
      // Convert local URI to blob
      let blob: Blob;
      if (Platform.OS === 'web') {
        const response = await fetch(localUri);
        blob = await response.blob();
      } else {
        // For React Native, we need to handle file differently
        const response = await fetch(localUri);
        blob = await response.blob();
      }


      const imageRef = ref(storage, `gallery-images/${itemId}`);
      
      // Upload image
      const snapshot = await uploadBytes(imageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Image uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Delete image from Firebase Storage
  private async deleteImageFromStorage(cloudUri: string): Promise<void> {
    try {
      const imageRef = ref(storage, cloudUri);
      await deleteObject(imageRef);
      console.log('Image deleted from storage');
    } catch (error) {
      console.error('Error deleting image from storage:', error);
      // Don't throw error for deletion failures
    }
  }

  // Upload gallery item to Firestore
  public async uploadGalleryItem(item: GalleryItem, user: User): Promise<string> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      throw new Error('Sync service not available');
    }

    try {
      console.log('Uploading gallery item to Firestore...', item.id);
      
      // Upload image to storage first
      const cloudUri = await this.uploadImageToStorage(item.uri, item.id);
      

      const firebaseItem: Omit<FirebaseGalleryItem, 'cloudId'> = {
        id: item.id,
        caption: item.caption,
        timestamp: item.timestamp,
        userId: user.id,
        cloudUri,
        localUri: item.uri,
        synced: true,
        lastModified: serverTimestamp() as Timestamp
      };


      const docRef = await addDoc(collection(db, 'gallery'), firebaseItem);
      
      console.log('Gallery item uploaded successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error uploading gallery item:', error);
      throw error;
    }
  }

  // Update gallery item in Firestore
  public async updateGalleryItem(itemId: string, updates: Partial<GalleryItem>): Promise<void> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      throw new Error('Sync service not available');
    }

    try {
      console.log('Updating gallery item in Firestore...', itemId);
      
      // Find the Firestore document
      const q = query(collection(db, 'gallery'), where('id', '==', itemId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Item not found in Firestore');
      }

      const docSnapshot = querySnapshot.docs[0];
      await updateDoc(docSnapshot.ref, {
        ...updates,
        lastModified: serverTimestamp()
      });
      
      console.log('Gallery item updated successfully');
    } catch (error) {
      console.error('Error updating gallery item:', error);
      throw error;
    }
  }

  // Delete gallery item from Firestore
  public async deleteGalleryItem(itemId: string): Promise<void> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      throw new Error('Sync service not available');
    }

    try {
      console.log('Deleting gallery item from Firestore...', itemId);
      
      // Find the Firestore document
      const q = query(collection(db, 'gallery'), where('id', '==', itemId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0];
        const data = docSnapshot.data() as FirebaseGalleryItem;
        
        // Delete image from storage if exists
        if (data.cloudUri) {
          await this.deleteImageFromStorage(data.cloudUri);
        }
        
        // Delete document from Firestore
        await deleteDoc(docSnapshot.ref);
      }
      
      console.log('Gallery item deleted successfully');
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }

  // Download gallery items from Firestore
  public async downloadGalleryItems(user: User): Promise<GalleryItem[]> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      throw new Error('Sync service not available');
    }

    try {
      console.log('Downloading gallery items from Firestore...');
      
      const q = query(
        collection(db, 'gallery'),
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: GalleryItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseGalleryItem;
        items.push({
          id: data.id,
          uri: data.cloudUri || data.localUri || '',
          caption: data.caption,
          timestamp: data.timestamp,
          userId: data.userId
        });
      });
      
      console.log(`Downloaded ${items.length} gallery items`);
      return items;
    } catch (error) {
      console.error('Error downloading gallery items:', error);
      throw error;
    }
  }

  // Sync local changes to cloud
  public async syncLocalToCloud(user: User): Promise<void> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      console.log('Skipping sync - service not available or offline');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      
      console.log('Syncing local changes to cloud...');
      
      // Get local items
      const localItems = await storageService.getGalleryItems();
      const userItems = localItems.filter(item => item.userId === user.id);
      
      // Get cloud items to compare
      const cloudItems = await this.downloadGalleryItems(user);
      const cloudItemIds = new Set(cloudItems.map(item => item.id));
      
      let uploadCount = 0;
      this.updateSyncStatus({ pendingUploads: userItems.length });
      
      // Upload new/modified local items
      for (const localItem of userItems) {
        try {
          if (!cloudItemIds.has(localItem.id)) {
            // Item doesn't exist in cloud, upload it
            const cloudId = await this.uploadGalleryItem(localItem, user);
            await storageService.markItemSynced(localItem.id, cloudId);
            uploadCount++;
          }
          
          this.updateSyncStatus({ 
            pendingUploads: Math.max(0, this.syncStatus.pendingUploads - 1) 
          });
        } catch (error) {
          console.error(`Failed to sync item ${localItem.id}:`, error);
        }
      }
      
      console.log(`Synced ${uploadCount} items to cloud`);
      this.updateSyncStatus({ 
        lastSyncTime: Date.now(),
        pendingUploads: 0
      });
    } catch (error) {
      console.error('Error syncing local to cloud:', error);
      this.updateSyncStatus({ error: 'Failed to sync to cloud' });
    } finally {
      this.updateSyncStatus({ isSyncing: false });
    }
  }

  // Sync cloud changes to local
  public async syncCloudToLocal(user: User): Promise<void> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      console.log('Skipping sync - service not available or offline');
      return;
    }

    try {
      console.log('Syncing cloud changes to local...');
      
      // Get cloud items
      const cloudItems = await this.downloadGalleryItems(user);
      
      // Get local items
      const localItems = await storageService.getGalleryItems();
      const localItemIds = new Set(localItems.map(item => item.id));
      
      let downloadCount = 0;
      this.updateSyncStatus({ pendingDownloads: cloudItems.length });
      
      // Download new cloud items
      for (const cloudItem of cloudItems) {
        try {
          if (!localItemIds.has(cloudItem.id)) {
            // Item doesn't exist locally, add it
            await storageService.addGalleryItem({
              ...cloudItem,
              // Mark as synced since it came from cloud
            });
            downloadCount++;
          }
          
          this.updateSyncStatus({ 
            pendingDownloads: Math.max(0, this.syncStatus.pendingDownloads - 1) 
          });
        } catch (error) {
          console.error(`Failed to download item ${cloudItem.id}:`, error);
        }
      }
      
      console.log(`Downloaded ${downloadCount} new items from cloud`);
      this.updateSyncStatus({ 
        lastSyncTime: Date.now(),
        pendingDownloads: 0
      });
    } catch (error) {
      console.error('Error syncing cloud to local:', error);
      this.updateSyncStatus({ error: 'Failed to sync from cloud' });
    }
  }

  // Perform full bidirectional sync
  public async performFullSync(user?: User): Promise<void> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      console.log('Skipping full sync - service not available or offline');
      return;
    }

    if (!user) {
      console.log('Skipping sync - no user provided');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      
      console.log('Starting full bidirectional sync...');
      
      await this.syncLocalToCloud(user);
      await this.syncCloudToLocal(user);
      
      console.log('Full sync completed successfully');
      this.updateSyncStatus({ 
        lastSyncTime: Date.now(),
        error: null
      });
    } catch (error) {
      console.error('Error performing full sync:', error);
      this.updateSyncStatus({ error: 'Full sync failed' });
    } finally {
      this.updateSyncStatus({ isSyncing: false });
    }
  }

  // Enable real-time sync
  public enableRealtimeSync(user: User, onItemsChanged: (items: GalleryItem[]) => void): void {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      console.log('Cannot enable real-time sync - service not available');
      return;
    }

    try {
      console.log('Enabling real-time sync...');
      
      const q = query(
        collection(db, 'gallery'),
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc')
      );
      
      this.unsubscribeRealtimeSync = onSnapshot(q, (querySnapshot) => {
        const items: GalleryItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as FirebaseGalleryItem;
          items.push({
            id: data.id,
            uri: data.cloudUri || data.localUri || '',
            caption: data.caption,
            timestamp: data.timestamp,
            userId: data.userId
          });
        });
        
        console.log(`Real-time update: ${items.length} items`);
        onItemsChanged(items);
      }, (error) => {
        console.error('Real-time sync error:', error);
        this.updateSyncStatus({ error: 'Real-time sync failed' });
      });
      
      console.log('Real-time sync enabled');
    } catch (error) {
      console.error('Error enabling real-time sync:', error);
      this.updateSyncStatus({ error: 'Failed to enable real-time sync' });
    }
  }

  // Disable real-time sync
  public disableRealtimeSync(): void {
    if (this.unsubscribeRealtimeSync) {
      this.unsubscribeRealtimeSync();
      this.unsubscribeRealtimeSync = null;
      console.log('Real-time sync disabled');
    }
  }

  // Force sync - useful for manual refresh
  public async forcSync(user: User): Promise<void> {
    console.log('Force sync triggered');
    await this.performFullSync(user);
  }


  public async itemExistsInCloud(itemId: string): Promise<boolean> {
    if (!this.isInitialized || !this.syncStatus.isOnline) {
      return false;
    }

    try {
      const q = query(collection(db, 'gallery'), where('id', '==', itemId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking item existence:', error);
      return false;
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();