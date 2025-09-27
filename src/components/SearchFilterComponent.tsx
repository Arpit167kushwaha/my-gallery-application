import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { GalleryItem } from '../types';

export interface SearchFilters {
  searchText: string;
  sortBy: 'newest' | 'oldest' | 'alphabetical';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface SearchFilterComponentProps {
  items: GalleryItem[];
  onFiltersChange: (filteredItems: GalleryItem[]) => void;
  onSearchChange?: (searchText: string) => void;
}

export const SearchFilterComponent: React.FC<SearchFilterComponentProps> = ({
  items,
  onFiltersChange,
  onSearchChange,
}) => {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    sortBy: 'newest',
    dateRange: 'all',
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: theme.colors.text,
      fontSize: 16,
      ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
    },
    clearButton: {
      padding: 4,
    },
    filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      color: theme.colors.text,
      marginLeft: 4,
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    resultsText: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.6,
      marginTop: 4,
    },
    
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      minWidth: 300,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    filterSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
    },
    optionButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    optionText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 12,
    },
    optionTextActive: {
      color: '#FFFFFF',
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    applyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  // Apply filters whenever search text or filters change
  useEffect(() => {
    const filteredItems = applyFilters(items, { ...filters, searchText });
    onFiltersChange(filteredItems);
    onSearchChange?.(searchText);
  }, [searchText, filters, items]);

  const applyFilters = (items: GalleryItem[], currentFilters: SearchFilters): GalleryItem[] => {
    let filtered = [...items];

    // Text search
    if (currentFilters.searchText.trim()) {
      const searchLower = currentFilters.searchText.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.caption?.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (currentFilters.dateRange !== 'all') {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      let cutoff: number;

      switch (currentFilters.dateRange) {
        case 'today':
          cutoff = now - day;
          break;
        case 'week':
          cutoff = now - (7 * day);
          break;
        case 'month':
          cutoff = now - (30 * day);
          break;
        default:
          cutoff = 0;
      }

      filtered = filtered.filter(item => item.timestamp >= cutoff);
    }

    // Sort
    switch (currentFilters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => {
          const aCaption = a.caption || '';
          const bCaption = b.caption || '';
          return aCaption.localeCompare(bCaption);
        });
        break;
    }

    return filtered;
  };

  const clearSearch = () => {
    setSearchText('');
  };

  const resetFilters = () => {
    setFilters({
      searchText: '',
      sortBy: 'newest',
      dateRange: 'all',
    });
    setSearchText('');
  };

  const applyModalFilters = () => {
    setShowFilters(false);
  };

  const getFilteredCount = () => {
    return applyFilters(items, { ...filters, searchText }).length;
  };

  const hasActiveFilters = () => {
    return searchText.trim() !== '' || 
           filters.sortBy !== 'newest' || 
           filters.dateRange !== 'all';
  };

  return (
    <>
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search-outline" 
            size={20} 
            color={theme.colors.text} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search captions..."
            placeholderTextColor={theme.colors.text + '80'}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filters Row */}
        <View style={styles.filtersRow}>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setShowFilters(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={16} 
              color={theme.colors.text} 
            />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filters.sortBy !== 'newest' && styles.filterButtonActive
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons 
              name="swap-vertical-outline" 
              size={16} 
              color={filters.sortBy !== 'newest' ? '#FFFFFF' : theme.colors.text} 
            />
            <Text style={[
              styles.filterButtonText,
              filters.sortBy !== 'newest' && styles.filterButtonTextActive
            ]}>
              Sort
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filters.dateRange !== 'all' && styles.filterButtonActive
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={filters.dateRange !== 'all' ? '#FFFFFF' : theme.colors.text} 
            />
            <Text style={[
              styles.filterButtonText,
              filters.dateRange !== 'all' && styles.filterButtonTextActive
            ]}>
              Date
            </Text>
          </TouchableOpacity>

          {hasActiveFilters() && (
            <TouchableOpacity 
              style={styles.filterButton} 
              onPress={resetFilters}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.colors.text} />
              <Text style={styles.filterButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results Count */}
        <Text style={styles.resultsText}>
          {getFilteredCount()} of {items.length} items
        </Text>
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters & Sorting</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowFilters(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort By Section */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Sort By</Text>
                
                {(['newest', 'oldest', 'alphabetical'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      filters.sortBy === option && styles.optionButtonActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortBy: option }))}
                  >
                    <Ionicons 
                      name={filters.sortBy === option ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={filters.sortBy === option ? '#FFFFFF' : theme.colors.text}
                    />
                    <Text style={[
                      styles.optionText,
                      filters.sortBy === option && styles.optionTextActive
                    ]}>
                      {option === 'newest' ? 'Newest First' : 
                       option === 'oldest' ? 'Oldest First' : 
                       'Alphabetical'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range Section */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Date Range</Text>
                
                {(['all', 'today', 'week', 'month'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      filters.dateRange === option && styles.optionButtonActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, dateRange: option }))}
                  >
                    <Ionicons 
                      name={filters.dateRange === option ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={filters.dateRange === option ? '#FFFFFF' : theme.colors.text}
                    />
                    <Text style={[
                      styles.optionText,
                      filters.dateRange === option && styles.optionTextActive
                    ]}>
                      {option === 'all' ? 'All Time' : 
                       option === 'today' ? 'Today' : 
                       option === 'week' ? 'This Week' : 
                       'This Month'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={applyModalFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};