import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, getDocs, where } from 'firebase/firestore';

const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  errorRed: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  borderRadius: 12,
};

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    totalBudgets: 0,
    pendingBudgets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario es admin
    if (!userData || userData.role !== 'admin') {
      router.replace('/');
      return;
    }

    fetchStats();
  }, [userData]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Obtener total de usuarios
      const usersSnapshot = await getDocs(collection(db, 'usuarios'));
      const totalUsers = usersSnapshot.size;

      // Obtener total de mascotas activas
      const petsSnapshot = await getDocs(collection(db, 'mascotas'));
      const totalPets = petsSnapshot.docs.filter(doc => doc.data().status === 'activo').length;

      // Obtener total de presupuestos y presupuestos pendientes
      const budgetsQuery = query(collection(db, 'presupuestos'));
      const budgetsSnapshot = await getDocs(budgetsQuery);
      const totalBudgets = budgetsSnapshot.size;

      // Contar presupuestos pendientes
      const pendingBudgets = budgetsSnapshot.docs.filter(doc => 
        doc.data().status === 'solicitado'
      ).length;

      console.log('Estadísticas obtenidas:', {
        totalUsers,
        totalPets,
        totalBudgets,
        pendingBudgets
      });

      setStats({
        totalUsers,
        totalPets,
        totalBudgets,
        pendingBudgets
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialIcons name={icon} size={24} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const AdminSection = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.sectionCard} onPress={onPress}>
      <MaterialIcons name={icon} size={24} color={theme.primaryColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <MaterialIcons name="chevron-right" size={24} color={theme.greyLight} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>Bienvenido, {userData?.nombreCompleto || 'Administrador'}</Text>
        <TouchableOpacity
          style={{marginLeft: 'auto', backgroundColor: theme.primaryColor, padding: 8, borderRadius: 8, marginTop: 10}}
          onPress={() => router.push('/')}
        >
          <Text style={{color: theme.white, fontWeight: 'bold'}}>Ir a página principal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Usuarios Totales"
          value={stats.totalUsers}
          icon="people"
          color="#2A9D8F"
        />
        <StatCard
          title="Mascotas Registradas"
          value={stats.totalPets}
          icon="pets"
          color="#E9C46A"
        />
        <StatCard
          title="Presupuestos Totales"
          value={stats.totalBudgets}
          icon="receipt"
          color="#264653"
        />
        <StatCard
          title="Presupuestos Pendientes"
          value={stats.pendingBudgets}
          icon="pending"
          color="#E76F51"
        />
      </View>

      <View style={styles.sectionsContainer}>
        <AdminSection
          title="Gestionar Usuarios"
          icon="people"
          onPress={() => router.push('/admin/users')}
        />
        <AdminSection
          title="Gestionar Presupuestos"
          icon="receipt"
          onPress={() => router.push('/admin/budgets')}
        />
        <AdminSection
          title="Configuración"
          icon="settings"
          onPress={() => router.push('/admin/settings')}
        />
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.dark,
  },
  subtitle: {
    fontSize: 16,
    color: theme.dark,
    marginTop: 4,
  },
  statsContainer: {
    padding: 20,
    gap: 15,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    padding: 20,
    borderRadius: theme.borderRadius,
    borderLeftWidth: 4,
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
  statContent: {
    marginLeft: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.dark,
  },
  statTitle: {
    fontSize: 14,
    color: theme.dark,
  },
  sectionsContainer: {
    padding: 20,
    gap: 15,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    padding: 20,
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
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.dark,
    marginLeft: 15,
  },
}); 