import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSync } from '../contexts/SyncContext';

export const SyncStatusComponent: React.FC = () => {
  const { theme } = useTheme();
  const { syncStatus, enableSync, toggleSync, forcSync } = useSync();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    statusContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIcon: {
      marginRight: 8,
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.8,
    },
    syncingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    syncingText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.notification,
    },
    actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 4,
      marginLeft: 8,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: enableSync ? theme.colors.primary : theme.colors.surface,
    },
    toggleText: {
      fontSize: 10,
      color: enableSync ? '#FFFFFF' : theme.colors.text,
      marginLeft: 4,
    },
  });

  const getStatusIcon = () => {
    if (!enableSync) {
      return <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.text} style={styles.statusIcon} />;
    }
    
    if (!syncStatus.isOnline) {
      return <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.notification} style={styles.statusIcon} />;
    }

    if (syncStatus.isSyncing) {
      return <ActivityIndicator size="small" color={theme.colors.primary} style={styles.statusIcon} />;
    }

    if (syncStatus.error) {
      return <Ionicons name="warning-outline" size={16} color={theme.colors.notification} style={styles.statusIcon} />;
    }

    if (syncStatus.pendingUploads > 0 || syncStatus.pendingDownloads > 0) {
      return <Ionicons name="sync-outline" size={16} color={theme.colors.accent} style={styles.statusIcon} />;
    }

    return <Ionicons name="cloud-done-outline" size={16} color={theme.colors.primary} style={styles.statusIcon} />;
  };

  const getStatusText = () => {
    if (!enableSync) {
      return 'Sync disabled';
    }

    if (!syncStatus.isOnline) {
      return 'Offline';
    }

    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }

    if (syncStatus.error) {
      return `Error: ${syncStatus.error}`;
    }

    const pending = syncStatus.pendingUploads + syncStatus.pendingDownloads;
    if (pending > 0) {
      return `${pending} items pending`;
    }

    if (syncStatus.lastSyncTime) {
      const lastSync = new Date(syncStatus.lastSyncTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
      
      if (diffMinutes === 0) {
        return 'Just synced';
      } else if (diffMinutes < 60) {
        return `Synced ${diffMinutes}m ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        return `Synced ${diffHours}h ago`;
      }
    }

    return 'Ready to sync';
  };

  const handleForceSync = async () => {
    if (enableSync && !syncStatus.isSyncing) {
      try {
        await forcSync();
      } catch (error) {
        console.error('Manual sync failed:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        {getStatusIcon()}
        <Text style={[styles.statusText, syncStatus.error && styles.errorText]}>
          {getStatusText()}
        </Text>
      </View>

      <View style={styles.actionContainer}>
        {/* Manual sync button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleForceSync}
          disabled={!enableSync || syncStatus.isSyncing}
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={!enableSync || syncStatus.isSyncing ? theme.colors.border : theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Sync toggle */}
        <TouchableOpacity style={styles.toggleButton} onPress={toggleSync}>
          <Ionicons
            name={enableSync ? "cloud-outline" : "cloud-offline-outline"}
            size={12}
            color={enableSync ? '#FFFFFF' : theme.colors.text}
          />
          <Text style={styles.toggleText}>
            {enableSync ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};