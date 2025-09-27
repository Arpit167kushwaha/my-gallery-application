import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { GalleryProvider } from './src/contexts/GalleryContext';
import { SyncProvider } from './src/contexts/SyncContext';
import { Navigation } from './src/components/Navigation';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <GalleryProvider>
              <Navigation />
              <StatusBar style="auto" />
            </GalleryProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
