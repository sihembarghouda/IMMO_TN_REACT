import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatPrice } from '../../utils/constants';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen({ route, navigation }) {
  const { propertyId } = route.params;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchPropertyDetails();
  }, []);

  const fetchPropertyDetails = async () => {
    try {
      const response = await api.get(`/properties/${propertyId}`);
      setProperty(response.data);
      checkFavorite(response.data.id);
    } catch (error) {
      console.error('Error fetching property:', error);
      Alert.alert('Erreur', 'Impossible de charger la propriété');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async (id) => {
    try {
      const response = await api.get('/favorites');
      const favorites = response.data;
      setIsFavorite(favorites.some(fav => fav.property_id === id));
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${propertyId}`);
        setIsFavorite(false);
        Alert.alert('Succès', 'Retiré des favoris');
      } else {
        await api.post('/favorites', { propertyId });
        setIsFavorite(true);
        Alert.alert('Succès', 'Ajouté aux favoris');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleContact = () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez vous connecter pour contacter le propriétaire.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    if (property.owner_phone) {
      Linking.openURL(`tel:${property.owner_phone}`);
    } else {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible');
    }
  };

  const handleMessage = () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez vous connecter pour envoyer un message.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    console.log('Navigating to chat with:', {
      recipientId: property.user_id,
      recipientName: property.owner_name
    });

    navigation.navigate('Chat', {
      recipientId: property.user_id,
      recipientName: property.owner_name,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <Text>Propriété introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          {property.images && property.images.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={property.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.image}
                  />
                )}
              />
              <View style={styles.paginationContainer}>
                {property.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <Image
              source={{ uri: property.image || 'https://via.placeholder.com/400x300' }}
              style={styles.image}
            />
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? COLORS.danger : COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{property.transaction_type}</Text>
            </View>
            <Text style={styles.price}>{formatPrice(property.price)}</Text>
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.location}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.locationText}>{`${property.address}, ${property.city}`}</Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="bed" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Chambres</Text>
              <Text style={styles.statValue}>{property.bedrooms}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="water" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Salles de bain</Text>
              <Text style={styles.statValue}>{property.bathrooms}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="expand" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Surface</Text>
              <Text style={styles.statValue}>{property.surface} m²</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de propriété</Text>
            <Text style={styles.propertyType}>{property.type}</Text>
          </View>

          {property.user_id !== user?.id && (
            <View style={styles.owner}>
              <View style={styles.ownerInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={30} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.ownerName}>{property.owner_name}</Text>
                  <Text style={styles.ownerLabel}>Propriétaire</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {property.user_id !== user?.id && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.callButton} onPress={handleContact}>
            <Ionicons name="call" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}
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
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.white,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.gray,
    marginLeft: 5,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.light,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 22,
  },
  propertyType: {
    fontSize: 16,
    color: COLORS.dark,
  },
  owner: {
    marginTop: 10,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  ownerLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
