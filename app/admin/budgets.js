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
  Platform,
  Modal,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { db } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, addDoc, deleteDoc } from 'firebase/firestore';

const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  errorRed: '#E76F51',
  successGreen: '#28a745',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  borderRadius: 12,
};

const STATUS_COLORS = {
  solicitado: '#E9C46A',
  aprobado: '#28a745',
  rechazado: '#E76F51',
  completado: '#2A9D8F'
};

export default function BudgetsManagement() {
  const router = useRouter();
  const { userData } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [massActionLoading, setMassActionLoading] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 500;

  useEffect(() => {
    if (!userData || userData.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchBudgets();
  }, [userData]);

  useEffect(() => {
    filterBudgets();
  }, [searchQuery, statusFilter, budgets]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const budgetsQuery = query(
        collection(db, 'presupuestos'),
        orderBy('createdAt', 'desc')
      );
      const budgetsSnapshot = await getDocs(budgetsQuery);
      const budgetsData = budgetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      Alert.alert('Error', 'No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    let filtered = budgets;
    
    // Filtrar por estado
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(budget => {
        const ownerName = budget.ownerData?.nombre?.toLowerCase() || '';
        const ownerEmail = budget.ownerData?.email?.toLowerCase() || '';
        const petNames = budget.animals?.map(animal => animal.nombre?.toLowerCase() || '').join(' ') || '';
        
        return (
          ownerName.includes(searchLower) ||
          ownerEmail.includes(searchLower) ||
          petNames.includes(searchLower)
        );
      });
    }
    
    setFilteredBudgets(filtered);
  };

  const updateBudgetStatus = async (budgetId, newStatus, silent = false, presupuestoArg = null) => {
    try {
      await updateDoc(doc(db, 'presupuestos', budgetId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      const presupuesto = presupuestoArg || budgets.find(b => b.id === budgetId);
      // Si el nuevo estado es 'aprobado', crear mascotas si no existen
      if (newStatus === 'aprobado') {
        if (!presupuesto) {
          console.error('[Mascotas] No se encontró el presupuesto para crear mascotas:', budgetId);
          if (!silent) Alert.alert('Error', 'No se encontró el presupuesto para crear mascotas.');
        } else if (!Array.isArray(presupuesto.animals) || presupuesto.animals.length === 0) {
          console.warn('[Mascotas] El array animals está vacío o mal estructurado:', presupuesto.animals);
          if (!silent) Alert.alert('Advertencia', 'No hay mascotas para registrar en este presupuesto.');
        } else {
          for (const animal of presupuesto.animals) {
            try {
              const mascotaData = {
                ...animal,
                ownerUid: presupuesto.uidUsuario || '',
                ownerNombre: presupuesto.ownerData?.nombre || '',
                ownerEmail: presupuesto.ownerData?.email || '',
                presupuestoId: presupuesto.id,
                status: 'activo',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await addDoc(collection(db, 'mascotas'), mascotaData);
              console.log('[Mascotas] Mascota creada correctamente:', mascotaData);
            } catch (err) {
              console.error('[Mascotas] Error al crear la mascota:', err);
              if (!silent) Alert.alert('Error', 'Ocurrió un error al crear una mascota. Revisa la consola.');
            }
          }
        }
      }
      // Si el nuevo estado es 'rechazado', actualizar mascotas asociadas a ese presupuesto a 'rechazado'
      if (newStatus === 'rechazado') {
        try {
          const mascotasQuery = query(collection(db, 'mascotas'), where('presupuestoId', '==', presupuesto.id));
          const mascotasSnapshot = await getDocs(mascotasQuery);
          for (const docMascota of mascotasSnapshot.docs) {
            await updateDoc(doc(db, 'mascotas', docMascota.id), {
              status: 'rechazado',
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('[Mascotas] Error al actualizar mascotas a rechazado:', err);
        }
      }

      await fetchBudgets();

      if (!silent) {
        Alert.alert('Éxito', `Estado del presupuesto actualizado a ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating budget status:', error);
      if (!silent) {
        Alert.alert('Error', 'No se pudo actualizar el estado del presupuesto');
      }
    }
  };

  // Nueva función para navegar a la edición de presupuesto
  const handleEditBudget = (budget) => {
    router.push({ pathname: '/admin/budgetEdit', params: { id: budget.id } });
  };

  const BudgetCard = ({ budget, isMobile }) => {
    const [localStatus, setLocalStatus] = useState(budget.status);
    const [savingStatus, setSavingStatus] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const handleStatusChange = async (newStatus) => {
      setModalVisible(false);
      if (newStatus !== localStatus) {
        setLocalStatus(newStatus);
        setSavingStatus(true);
        await updateBudgetStatus(budget.id, newStatus, false, budget);
        setSavingStatus(false);
      }
    };

    const statusOptions = [
      { label: 'Aprobado', value: 'aprobado', color: '#28a745' },
      { label: 'Rechazado', value: 'rechazado', color: '#E76F51' },
      { label: 'Completado', value: 'completado', color: '#2A9D8F' },
    ];

    const getStatusLabel = (value) => {
      const opt = statusOptions.find(o => o.value === value);
      return opt ? opt.label : value;
    };
    const getStatusColor = (value) => {
      const opt = statusOptions.find(o => o.value === value);
      return opt ? opt.color : theme.primaryColor;
    };

    return (
      <View style={[styles.budgetCard, isMobile && { width: '100%', padding: 8 }]}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetDate}>
              {new Date(budget.createdAt).toLocaleDateString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[budget.status] }]}>
              <Text style={styles.statusText}>{budget.status}</Text>
            </View>
          </View>
          <Text style={styles.budgetId}>ID: {budget.id.slice(0, 8)}</Text>
        </View>

        <View style={styles.budgetContent}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isMobile && { fontSize: 12 }]}>Datos del Cliente</Text>
            <Text style={[styles.text, isMobile && { fontSize: 12 }]}>{budget.ownerData?.nombre || 'Sin nombre'}</Text>
            <Text style={[styles.text, isMobile && { fontSize: 12 }]}>{budget.ownerData?.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isMobile && { fontSize: 12 }]}>Mascotas</Text>
            {budget.animals?.map((animal, index) => (
              <Text key={index} style={[styles.text, isMobile && { fontSize: 12 }]}>
                {animal.nombre} ({animal.tipo})
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isMobile && { fontSize: 12 }]}>Plan Seleccionado</Text>
            <Text style={[styles.text, isMobile && { fontSize: 12 }]}>{(budget.planNombre !== undefined && budget.planNombre !== null && budget.planNombre !== '') ? budget.planNombre : 'No especificado'}</Text>
            <Text style={[styles.text, isMobile && { fontSize: 12 }]}>
              Precio: {(budget.precioEstimado !== undefined && budget.precioEstimado !== null && String(budget.precioEstimado).trim() !== '')
                ? budget.precioEstimado
                : 'No especificado'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {budget.status === 'solicitado' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.successGreen }]}
                onPress={() => updateBudgetStatus(budget.id, 'aprobado', false, budget)}
              >
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.errorRed }]}
                onPress={() => updateBudgetStatus(budget.id, 'rechazado', false, budget)}
              >
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Solo mostrar cambiar estado si NO es solicitado */}
          {budget.status !== 'solicitado' && (
            <>
              <Text style={{ color: theme.secondaryColor, fontWeight: 'bold', marginRight: 8, fontSize: 15 }}>
                Cambiar estado:
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.white,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: getStatusColor(localStatus),
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  minWidth: 120,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: savingStatus ? 0.6 : 1,
                }}
                onPress={() => setModalVisible(true)}
                disabled={savingStatus}
              >
                <Text style={{ color: getStatusColor(localStatus), fontWeight: 'bold', fontSize: 15 }}>{getStatusLabel(localStatus)}</Text>
              </TouchableOpacity>
              {/* Modal personalizado */}
              <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={{ flex: 1, backgroundColor: '#000B', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: theme.white, borderRadius: 16, padding: 28, minWidth: 280, alignItems: 'center', borderWidth: 2, borderColor: theme.secondaryColor }}>
                    <Text style={{ fontSize: 19, fontWeight: 'bold', color: theme.secondaryColor, marginBottom: 20, letterSpacing: 0.5 }}>
                      Selecciona el nuevo estado
                    </Text>
                    {statusOptions.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={{
                          backgroundColor: theme.white,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: opt.color,
                          paddingVertical: 13,
                          paddingHorizontal: 28,
                          marginBottom: 14,
                          minWidth: 180,
                          alignItems: 'center',
                          opacity: localStatus === opt.value ? 0.7 : 1,
                        }}
                        onPress={() => handleStatusChange(opt.value)}
                        disabled={savingStatus}
                      >
                        <Text style={{ color: opt.color, fontWeight: 'bold', fontSize: 16 }}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={{ marginTop: 10, padding: 8, borderRadius: 8 }}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={{ color: theme.errorRed, fontWeight: 'bold', fontSize: 15 }}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </>
          )}
        </View>
      </View>
    );
  };

  const StatusFilter = () => (
    <View style={[styles.filterContainer, isMobile
      ? { flexWrap: 'wrap', flexDirection: 'row', width: '100%', justifyContent: 'center' }
      : { flexDirection: 'row', flexWrap: 'nowrap', width: '100%', justifyContent: 'center' }
    ]}>
      {['todos', 'solicitado', 'aprobado', 'rechazado', 'completado'].map((status, idx) => (
        <View key={status} style={isMobile
          ? { width: '31%', marginBottom: 6, marginRight: (idx + 1) % 3 === 0 ? 0 : '3%', alignItems: 'center' }
          : { minWidth: 110, marginRight: idx < 4 ? 12 : 0 }
        }>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === status && styles.filterButtonActive,
              isMobile
                ? { width: '100%', paddingVertical: 6, paddingHorizontal: 0, minWidth: 0, alignItems: 'center', justifyContent: 'center' }
                : { minWidth: 110, alignItems: 'center', justifyContent: 'center' }
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive,
                { textAlign: 'center' },
                isMobile && { fontSize: 13, paddingHorizontal: 0 }
              ]}
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
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
    <View style={[styles.container, isMobile && { padding: 0 }]}>
      <View style={[styles.header, isMobile && { padding: 10 }]}>
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
        <Text style={styles.title}>Gestión de Presupuestos</Text>
      </View>

      <View style={[styles.searchContainer, isMobile && { margin: 8, padding: 6 }]}>
        <MaterialIcons name="search" size={24} color={theme.greyLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar presupuestos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <StatusFilter />

      <ScrollView style={[styles.budgetsList, isMobile && { padding: 6 }]}>
        {filteredBudgets.map(budget => (
          <BudgetCard key={budget.id} budget={budget} isMobile={isMobile} />
        ))}
        {filteredBudgets.length === 0 && (
          <Text style={styles.noResults}>No se encontraron presupuestos</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    width: '100%',
    overflowX: 'hidden',
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
    color: theme.dark,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
    width: '100%',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: theme.borderRadius,
    marginRight: 10,
    backgroundColor: theme.white,
  },
  filterButtonActive: {
    backgroundColor: theme.primaryColor,
  },
  filterButtonText: {
    color: theme.dark,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: theme.white,
  },
  budgetsList: {
    flex: 1,
    padding: 20,
  },
  budgetCard: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetDate: {
    fontSize: 14,
    color: theme.dark,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius,
  },
  statusText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '600',
  },
  budgetId: {
    fontSize: 12,
    color: theme.dark,
  },
  budgetContent: {
    marginBottom: 15,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.dark,
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    color: theme.dark,
    marginBottom: 2,
  },
  budgetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: theme.borderRadius,
  },
  actionButtonText: {
    color: theme.dark,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: theme.dark,
    marginTop: 20,
  },
}); 