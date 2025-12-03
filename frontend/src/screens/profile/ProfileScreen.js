import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ properties: 0, favorites: 0, views: 0 });

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
    
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        fetchStats();
      }
    });
    
    return unsubscribe;
  }, [isAuthenticated, navigation]);

  const fetchStats = async () => {
    try {
      const [propertiesRes, favoritesRes] = await Promise.all([
        api.get('/properties/user/my-properties'),
        api.get('/favorites')
      ]);
      setStats({
        properties: propertiesRes.data?.length || 0,
        favorites: favoritesRes.data?.length || 0,
        views: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.loginPrompt}>
          <Ionicons name="person-circle-outline" size={100} color={COLORS.gray} />
          <Text style={styles.loginPromptTitle}>Connexion requise</Text>
          <Text style={styles.loginPromptText}>
            Connectez-vous pour accéder à votre profil et gérer vos propriétés
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleLogout = async () => {
    // Use window.confirm for web, Alert for native
    const confirmLogout = Platform.OS === 'web' 
      ? window.confirm('Êtes-vous sûr de vouloir vous déconnecter?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter?',
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Déconnexion', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });
    
    if (!confirmLogout) {
      return;
    }
    
    try {
      console.log('Logging out...');
      await logout();
      console.log('Logout successful, navigating...');
      
      // Reset navigation stack to Login
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
      if (Platform.OS === 'web') {
        alert('Erreur: Impossible de se déconnecter');
      } else {
        Alert.alert('Erreur', 'Impossible de se déconnecter');
      }
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Modifier le profil',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'home-outline',
      title: 'Mes propriétés',
      onPress: () => navigation.navigate('MyProperties'),
    },
    {
      icon: 'heart-outline',
      title: 'Favoris',
      onPress: () => navigation.navigate('Favorites'),
    },
    {
      icon: 'settings-outline',
      title: 'Paramètres',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Sécurité',
      onPress: () => navigation.navigate('Security'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Assistant IA',
      onPress: () => navigation.navigate('AIAssistant'),
    },
    {
      icon: 'information-circle-outline',
      title: 'À propos',
      onPress: () => navigation.navigate('About'),
    },
    {
      icon: 'bug-outline',
      title: 'Debug & Tests',
      onPress: () => navigation.navigate('Debug'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color={COLORS.white} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          </View>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="home" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.properties}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="heart" size={24} color={COLORS.danger} />
            <Text style={styles.statNumber}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="eye" size={24} color={COLORS.secondary} />
            <Text style={styles.statNumber}>{stats.views}</Text>
            <Text style={styles.statLabel}>Vues</Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>IMMO_TN v1.0.0</Text>
        <Text style={styles.footerText}>© 2025 Tous droits réservés</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
    marginTop: 15,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 10,
  },
  userBio: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  menu: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 20,
    marginBottom: 10,
  },
  loginPromptText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    width: '100%',
    alignItems: 'center',
  },
  registerButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
