import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useGallery } from '../contexts/GalleryContext';
import { useImagePicker } from '../hooks/useImagePicker';
import { GalleryItemComponent } from '../components/GalleryItemComponent';
import { ThemedButton } from '../components/ThemedButton';
import { LoadingScreen } from '../components/LoadingScreen';
import { EmptyState } from '../components/EmptyState';
import { SyncStatusComponent } from '../components/SyncStatusComponent';
import { ShareTestComponent } from '../components/ShareTestComponent';
import { SearchFilterComponent } from '../components/SearchFilterComponent';
import { ResponsiveUtils } from '../utils/responsive';
import { GalleryItem } from '../types';

export const GalleryScreen: React.FC = () => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { user, signOut } = useAuth();
  const { items, isLoading, refreshItems, addItem } = useGallery();
  const { pickImage, isLoading: isPickingImage } = useImagePicker(addItem);
  const [refreshing, setRefreshing] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [showShareTest, setShowShareTest] = useState(false);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>(items);
  const [searchText, setSearchText] = useState('');
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Update filtered items when original items change
  useEffect(() => {
    if (!searchText) {
      setFilteredItems(items);
    }
  }, [items]);

  // Handle screen dimension changes for responsive layout
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    userEmail: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.6,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      padding: 8,
      marginLeft: 8,
    },
    content: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.6,
      textAlign: 'center',
      marginBottom: 32,
    },
    galleryList: {
      paddingHorizontal: ResponsiveUtils.getResponsiveConfig().containerPadding,
      paddingTop: ResponsiveUtils.getSpacing(16),
    },
    galleryItem: {
      marginHorizontal: ResponsiveUtils.getResponsiveConfig().itemSpacing / 2,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshItems();
    } catch (error) {
      console.error('Error refreshing:', error);
      Alert.alert('Error', 'Failed to refresh gallery');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = () => {
    // On web, Alert.alert doesn't work well, so confirm directly
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: signOut,
          },
        ]
      );
    }
  };

  const renderGalleryItem = ({ item }: { item: GalleryItem }) => (
    <View style={styles.galleryItem}>
      <GalleryItemComponent item={item} />
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="images-outline"
      title="Your Gallery is Empty"
      subtitle="Start building your personal gallery by adding your first image with a voice caption"
      actionTitle="Add Your First Image"
      onAction={() => {
        console.log('EmptyState button clicked!');
        pickImage();
      }}
      loading={isPickingImage}
    />
  );

  if (isLoading) {
    return <LoadingScreen message="Loading your gallery..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {user?.profilePicture && !profileImageError ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.avatarImage}
                onError={() => {
                  console.log('Profile image failed to load, showing initials');
                  setProfileImageError(true);
                }}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowShareTest(true)}
          >
            <Ionicons
              name="share-social-outline"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={toggleTheme}>
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              console.log('Logout button clicked!');
              handleSignOut();
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={theme.colors.notification}
            />
          </TouchableOpacity>
        </View>
      </View>

      <SyncStatusComponent />

      {items.length > 0 && (
        <SearchFilterComponent 
          items={items}
          onFiltersChange={setFilteredItems}
          onSearchChange={setSearchText}
        />
      )}

      <View style={styles.content}>
        {items.length === 0 ? (
          renderEmptyState()
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={64}
              color={theme.colors.text}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? `No images match "${searchText}"` : 'No images match your filters'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderGalleryItem}
            keyExtractor={(item) => item.id}
            numColumns={ResponsiveUtils.getResponsiveConfig().columns}
            key={`${screenDimensions.width}-${screenDimensions.height}`} // Force re-render on dimension change
            contentContainerStyle={styles.galleryList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          console.log('FAB button clicked!');
          pickImage();
        }}
        disabled={isPickingImage}
      >
        <Ionicons
          name="add"
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <ShareTestComponent 
        visible={showShareTest}
        onClose={() => setShowShareTest(false)}
      />
    </SafeAreaView>
  );
};