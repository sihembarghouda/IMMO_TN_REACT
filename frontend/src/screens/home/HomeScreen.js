import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatPrice, PROPERTY_TYPES, TRANSACTION_TYPES, CITIES } from '../../utils/constants';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCity, setSelectedCity] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const { unreadCount } = useNotifications();
  const { isAuthenticated, user } = useAuth();

  const requireAuth = (action, callback) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez vous connecter pour accéder à cette fonctionnalité.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    callback();
  };

  const handleAddProperty = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez vous connecter pour ajouter une propriété.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    if (user?.role !== 'seller') {
      Alert.alert(
        'Accès restreint',
        'Seuls les vendeurs peuvent ajouter des propriétés. Veuillez modifier votre rôle en "Vendeur" dans les paramètres du profil.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('AddProperty');
  };

  useEffect(() => {
    fetchProperties();
    if (isAuthenticated) {
      fetchFavorites();
    }
    
    // Rafraîchir les notifications à chaque fois qu'on arrive sur la page
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        fetchFavorites();
      }
    });
    
    return unsubscribe;
  }, [isAuthenticated]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      // Ensure we always set an array
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('Properties fetched:', data.length);
      if (data.length > 0) {
        console.log('First property images:', data[0].images);
      }
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/favorites');
      setFavorites(response.data.map(fav => fav.property_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (propertyId) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez vous connecter pour ajouter des favoris.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    // Vérifier si l'utilisateur est un acheteur
    if (user?.role !== 'buyer') {
      Alert.alert(
        'Accès restreint',
        'Seuls les acheteurs peuvent ajouter des annonces en favoris. Veuillez modifier votre rôle dans les paramètres du profil.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const isFavorite = favorites.includes(propertyId);
      
      if (isFavorite) {
        await api.delete(`/favorites/${propertyId}`);
        setFavorites(favorites.filter(id => id !== propertyId));
      } else {
        await api.post('/favorites', { property_id: propertyId });
        setFavorites([...favorites, propertyId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const filteredProperties = Array.isArray(properties) ? properties.filter(property => {
    const matchesSearch = property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || property?.type === selectedType;
    const matchesTransaction = selectedTransaction === 'all' || property?.transaction_type === selectedTransaction;
    const matchesCity = selectedCity === 'all' || property?.city === selectedCity;
    
    let matchesPrice = true;
    if (priceRange.min !== '' && property?.price) {
      matchesPrice = matchesPrice && property.price >= parseFloat(priceRange.min);
    }
    if (priceRange.max !== '' && property?.price) {
      matchesPrice = matchesPrice && property.price <= parseFloat(priceRange.max);
    }
    
    return matchesSearch && matchesType && matchesTransaction && matchesCity && matchesPrice;
  }) : [];

  const renderProperty = ({ item }) => {
    // Essayer d'abord le tableau images, puis l'image unique, puis placeholder
    let displayImage = 'https://via.placeholder.com/300x200?text=No+Image';
    
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      displayImage = item.images[0];
    } else if (item.image) {
      displayImage = item.image;
    }
    
    return (
      <TouchableOpacity
        style={styles.propertyCard}
        onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.id })}
      >
        <Image
          source={{ uri: displayImage }}
          style={styles.propertyImage}
          defaultSource={{ uri: 'https://via.placeholder.com/300x200?text=Loading' }}
          onError={(e) => {
            console.log(`Image load error for property ${item.id}:`, e.nativeEvent.error);
          }}
        />
        {item.images && Array.isArray(item.images) && item.images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images" size={16} color={COLORS.white} />
            <Text style={styles.imageCountText}>{item.images.length}</Text>
          </View>
        )}
        {isAuthenticated && user?.role === 'buyer' && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
          >
            <Ionicons
              name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={favorites.includes(item.id) ? COLORS.danger : COLORS.white}
            />
          </TouchableOpacity>
        )}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.propertyDetails}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.propertyLocation}>{item.city || 'N/A'}</Text>
        </View>
        <View style={styles.propertyStats}>
          <View style={styles.stat}>
            <Ionicons name="bed-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{item.bedrooms}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="water-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{item.bathrooms}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="expand-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{item.surface} m²</Text>
          </View>
        </View>
        <View style={styles.propertyFooter}>
          <Text style={styles.propertyPrice}>{formatPrice(item.price)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.transaction_type}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.headerTitle}>Trouvez votre propriété</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => requireAuth('notifications', () => navigation.navigate('Notifications'))}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
            {isAuthenticated && unreadCount > 0 && (
              <View style={styles.badge2}>
                <Text style={styles.badgeText2}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => requireAuth('assistant', () => navigation.navigate('AIAssistant'))}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une propriété..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          {Object.entries(PROPERTY_TYPES).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterButton, selectedType === key && styles.filterButtonActive]}
              onPress={() => setSelectedType(key)}
            >
              <Text style={[styles.filterText, selectedType === key && styles.filterTextActive]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.white} />
            <Text style={styles.advancedFilterText}>Filtres</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
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
      <FlatList
        data={filteredProperties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={80} color={COLORS.gray} />
            <Text style={styles.emptyText}>Aucune propriété trouvée</Text>
          </View>
        }
      />
      {isAuthenticated && user?.role === 'seller' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddProperty}
        >
          <Ionicons name="add" size={30} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres avancés</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Transaction Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Type de transaction</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, selectedTransaction === 'all' && styles.filterOptionActive]}
                    onPress={() => setSelectedTransaction('all')}
                  >
                    <Text style={[styles.filterOptionText, selectedTransaction === 'all' && styles.filterOptionTextActive]}>
                      Tous
                    </Text>
                  </TouchableOpacity>
                  {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.filterOption, selectedTransaction === key && styles.filterOptionActive]}
                      onPress={() => setSelectedTransaction(key)}
                    >
                      <Text style={[styles.filterOptionText, selectedTransaction === key && styles.filterOptionTextActive]}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* City Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Ville</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[styles.filterOption, selectedCity === 'all' && styles.filterOptionActive]}
                      onPress={() => setSelectedCity('all')}
                    >
                      <Text style={[styles.filterOptionText, selectedCity === 'all' && styles.filterOptionTextActive]}>
                        Toutes
                      </Text>
                    </TouchableOpacity>
                    {CITIES.slice(0, 10).map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[styles.filterOption, selectedCity === city && styles.filterOptionActive]}
                        onPress={() => setSelectedCity(city)}
                      >
                        <Text style={[styles.filterOptionText, selectedCity === city && styles.filterOptionTextActive]}>
                          {city}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Fourchette de prix (TND)</Text>
                <View style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    keyboardType="numeric"
                    value={priceRange.min}
                    onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
                  />
                  <Text style={styles.priceSeparator}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    keyboardType="numeric"
                    value={priceRange.max}
                    onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
                  />
                </View>
              </View>

              {/* Reset and Apply Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setSelectedTransaction('all');
                    setSelectedCity('all');
                    setPriceRange({ min: '', max: '' });
                  }}
                >
                  <Text style={styles.resetButtonText}>Réinitialiser</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.applyButtonText}>Appliquer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.gray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge2: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText2: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.light,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    gap: 5,
  },
  advancedFilterText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  filterOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: COLORS.light,
  },
  priceSeparator: {
    fontSize: 18,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  resetButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  applyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: 100,
  },
  propertyCard: {
    marginHorizontal: 20,
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
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  imageCountText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
  propertyStats: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});