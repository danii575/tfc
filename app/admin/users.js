import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { db } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  errorRed: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  borderRadius: 12,
};

export default function UsersManagement() {
  const router = useRouter();
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    if (!userData || userData.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchUsers();
  }, [userData]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'usuarios'));
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Si el usuario no tiene rol, asignarle 'user' por defecto
        if (!data.role) {
          updateDoc(doc.ref, { role: 'user' });
          return { ...data, role: 'user', id: doc.id };
        }
        return { ...data, id: doc.id };
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    const filtered = users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.nombreCompleto?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.telefono?.includes(searchQuery)
      );
    });
    setFilteredUsers(filtered);
  };

  const toggleUserRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'usuarios', userId), {
        role: newRole
      });
      
      // Actualizar el estado local
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      Alert.alert('Éxito', `Rol de usuario actualizado a ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'No se pudo actualizar el rol del usuario');
    }
  };

  const UserCard = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <MaterialIcons name="person" size={24} color={theme.primaryColor} />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.nombreCompleto || 'Sin nombre'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.telefono && <Text style={styles.userPhone}>{user.telefono}</Text>}
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            { backgroundColor: user.role === 'admin' ? theme.errorRed : theme.primaryColor }
          ]}
          onPress={() => toggleUserRole(user.id, user.role)}
        >
          <Text style={styles.roleButtonText}>
            {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else {
              router.push('/admin');
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Usuarios</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={theme.greyLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.dark}
        />
      </View>

      <ScrollView style={styles.usersList}>
        {filteredUsers.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
        {filteredUsers.length === 0 && (
          <Text style={styles.noResults}>No se encontraron usuarios</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.dark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    margin: 20,
    padding: 10,
    borderRadius: theme.borderRadius,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  usersList: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.dark,
  },
  userEmail: {
    fontSize: 14,
    color: theme.dark,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 14,
    color: theme.dark,
    marginTop: 2,
  },
  userActions: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  roleButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: theme.borderRadius,
  },
  roleButtonText: {
    color: theme.white,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: theme.dark,
    marginTop: 20,
  },
}); 