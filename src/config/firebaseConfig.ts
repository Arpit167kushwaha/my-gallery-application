import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "demo-api-key",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "my-gallery-demo.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "my-gallery-demo",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "my-gallery-demo.appspot.com",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "123456789",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Enable emulators in development (optional)
const isDevelopment = __DEV__ && Platform.OS === 'web';

if (isDevelopment) {
  try {
    // Connect to emulators if running in development
    // Uncomment these lines if you want to use Firebase emulators
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Firebase emulators already connected or not available');
  }
}

export default app;