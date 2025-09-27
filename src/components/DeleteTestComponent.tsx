import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const DeleteTestComponent: React.FC = () => {
  const handleDeleteTest = () => {
    console.log('DELETE TEST: Button was pressed!');
    
    if (Platform.OS === 'web') {
      alert('Delete test button pressed!');
    } else {
      Alert.alert('Test', 'Delete test button pressed!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Button Test</Text>
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={handleDeleteTest}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="red" />
        <Text style={styles.buttonText}>Test Delete</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

