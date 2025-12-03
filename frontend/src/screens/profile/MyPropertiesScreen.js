import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatPrice } from '../../utils/constants';
import api from '../../services/api';

export default function MyPropertiesScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProperties();
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyProperties();
    });
    
    return unsubscribe;
  }, [navigation]);

  const fetchMyProperties = async () => {
    try {
      const response = await api.get('/properties/user/my-properties');
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id) => {
    console.log('deleteProperty called with id:', id);
    
    // Use window.confirm for web, Alert for native
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm('Êtes-vous sûr de vouloir supprimer cette propriété?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Supprimer la propriété',
            'Êtes-vous sûr de vouloir supprimer cette propriété?',
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });
    
    if (!confirmDelete) {
      console.log('Delete cancelled');
      return;
    }
    
    console.log('Delete confirmed for property:', id);
    try {
      console.log('Sending DELETE request to:', `/properties/${id}`);
      const response = await api.delete(`/properties/${id}`);
      console.log('Delete successful:', response.data);
      
      setProperties(properties.filter(p => p.id !== id));
      
      if (Platform.OS === 'web') {
        alert('Propriété supprimée avec succès');
      } else {
        Alert.alert('Succès', 'Propriété supprimée avec succès');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      console.error('Error details:', error.response);
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Impossible de supprimer la propriété';
      
      if (Platform.OS === 'web') {
        alert(`Erreur: ${errorMessage}`);
      } else {
        Alert.alert('Erreur', errorMessage);
      }
    }
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.id })}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/300x200' }}
        style={styles.propertyImage}
      />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.propertyDetails}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.propertyLocation}>{item.city}</Text>
        </View>
        <Text style={styles.propertyPrice}>{formatPrice(item.price)}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditProperty', { propertyId: item.id })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteProperty(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
            <Text style={styles.actionText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Propriétés</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddProperty')}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={80} color={COLORS.gray} />
            <Text style={styles.emptyText}>Aucune propriété</Text>
            <Text style={styles.emptySubtext}>
              Commencez à ajouter vos propriétés
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
              <Text style={styles.addButtonText}>Ajouter une propriété</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  listContent: {
    padding: 20,
  },
  propertyCard: {
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  propertyInfo: {
    padding: 15,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  propertyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  propertyLocation: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 5,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
