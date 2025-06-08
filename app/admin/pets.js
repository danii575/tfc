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
  Picker
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { db } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, deleteDoc, startAfter, limit } from 'firebase/firestore';

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

export default function PetsManagement() {
  const router = useRouter();
  const { userData } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPets, setFilteredPets] = useState([]);
  const [typeFilter, setTypeFilter] = useState('todos');
  const [editingPet, setEditingPet] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPet, setDeletingPet] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [petsToDelete, setPetsToDelete] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    console.log("[PetsManagement] userData:", userData);
    if (!userData || userData.role !== 'admin') {
      console.log("[PetsManagement] Usuario no es admin, redirigiendo a /");
      router.replace('/');
      return;
    }
    fetchPets();
  }, [userData]);

  useEffect(() => {
    filterPets();
  }, [searchQuery, typeFilter, pets]);

  const fetchPets = async () => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para cargar mascotas. Debes ser administrador.');
      return;
    }
    try {
      setLoading(true);
      const petsQuery = query(
        collection(db, 'mascotas'),
        orderBy('createdAt', 'desc')
      );
      const petsSnapshot = await getDocs(petsQuery);
      const petsData = petsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPets(petsData);
    } catch (error) {
      console.error('Error fetching pets:', error);
      Alert.alert('Error', 'No se pudieron cargar las mascotas');
    } finally {
      setLoading(false);
    }
  };

  const filterPets = () => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para filtrar mascotas. Debes ser administrador.');
      return;
    }
    let filtered = pets;
    
    // Filtrar por tipo
    if (typeFilter !== 'todos') {
      filtered = filtered.filter(pet => pet.tipo === typeFilter);
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(pet => {
        const petName = pet.nombre?.toLowerCase() || '';
        const petBreed = pet.raza?.toLowerCase() || '';
        const ownerName = pet.ownerName?.toLowerCase() || '';
        
        return (
          petName.includes(searchLower) ||
          petBreed.includes(searchLower) ||
          ownerName.includes(searchLower)
        );
      });
    }
    
    setFilteredPets(filtered);
  };

  const updatePetStatus = async (petId, newStatus) => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para actualizar el estado de las mascotas. Debes ser administrador.');
      return;
    }
    try {
      await updateDoc(doc(db, 'mascotas', petId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Actualizar el estado local
      setPets(pets.map(pet => 
        pet.id === petId ? { ...pet, status: newStatus } : pet
      ));
      
      Alert.alert('Éxito', `Estado de la mascota actualizado a ${newStatus}`);
    } catch (error) {
      console.error('Error updating pet status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la mascota');
    }
  };

  const handleEditPet = (pet) => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para editar mascotas. Debes ser administrador.');
      return;
    }
    setEditingPet(pet);
    setEditForm({ ...pet });
  };

  const handleEditChange = (field, value) => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para editar mascotas. Debes ser administrador.');
      return;
    }
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para editar mascotas. Debes ser administrador.');
      return;
    }
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, 'mascotas', editingPet.id), editForm);
      setPets(pets.map(p => p.id === editingPet.id ? { ...editForm, id: editingPet.id } : p));
      setEditingPet(null);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la mascota');
    }
    setSavingEdit(false);
  };

  const handleDeletePet = async (pet) => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para eliminar mascotas. Debes ser administrador.');
      return;
    }
    setDeletingPet(pet);
    // Buscar todas las mascotas asociadas al mismo presupuesto
    if (pet.presupuestoId) {
      const petsSameBudget = pets.filter(p => p.presupuestoId === pet.presupuestoId);
      setPetsToDelete(petsSameBudget);
      setDeleteModalVisible(true);
    } else {
      setPetsToDelete([pet]);
      setDeleteModalVisible(true);
    }
  };

  const confirmDeletePet = async (deleteAll = false) => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para eliminar mascotas. Debes ser administrador.');
      return;
    }
    setDeleting(true);
    try {
      let petsToRemove = deleteAll ? petsToDelete : [deletingPet];
      // Eliminar mascotas
      await Promise.all(petsToRemove.map(async pet => {
        try {
          await deleteDoc(doc(db, 'mascotas', pet.id));
        } catch (err) {
          Alert.alert('Error eliminando mascota', err.message || JSON.stringify(err));
          throw err;
        }
      }));
      // Si tienen presupuesto asociado, actualizar el presupuesto
      if (deletingPet.presupuestoId) {
        const presupuestoRef = doc(db, 'presupuestos', deletingPet.presupuestoId);
        const presupuestoSnap = await getDocs(query(collection(db, 'mascotas'), where('presupuestoId', '==', deletingPet.presupuestoId)));
        const remainingPets = presupuestoSnap.docs.length - petsToRemove.length;
        if (remainingPets > 0) {
          // Actualizar precio proporcionalmente
          const presupuestoDoc = await presupuestoRef.get();
          if (presupuestoDoc.exists) {
            const presupuesto = presupuestoDoc.data();
            const precioPorMascota = (Number(presupuesto.precioEstimado) || 0) / (remainingPets + petsToRemove.length);
            const nuevoPrecio = precioPorMascota * remainingPets;
            await updateDoc(presupuestoRef, { precioEstimado: nuevoPrecio });
          }
        } else {
          // Si no quedan mascotas, puedes eliminar el presupuesto o dejarlo en 0
          await updateDoc(presupuestoRef, { precioEstimado: 0 });
        }
      }
      await fetchPets();
      setDeleteModalVisible(false);
      setDeletingPet(null);
      setPetsToDelete([]);
      Alert.alert('Éxito', 'Mascota(s) eliminada(s) correctamente.');
    } catch (e) {
      Alert.alert('Error', e.message || JSON.stringify(e));
    }
    setDeleting(false);
  };

  // Utilidad para dividir en lotes
  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Eliminar absolutamente todas las mascotas de la colección (solo admin)
  const handleDeleteAbsolutelyAllPets = async () => {
    if (!userData || userData.role !== 'admin') {
      Alert.alert('Error', 'No tienes permisos para eliminar todas las mascotas.');
      return;
    }
    Alert.alert(
      'Confirmar',
      '¿Seguro que quieres eliminar TODAS las mascotas de la base de datos? Esta acción es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo', style: 'destructive', onPress: async () => {
            try {
              let totalDeleted = 0;
              while (true) {
                const q = query(collection(db, 'mascotas'), orderBy('__name__'), limit(20));
                const snapshot = await getDocs(q);
                if (snapshot.empty) break;
                await Promise.all(snapshot.docs.map(docSnap => deleteDoc(doc(db, 'mascotas', docSnap.id))));
                totalDeleted += snapshot.docs.length;
                console.log(`Eliminadas ${totalDeleted} mascotas...`);
                await sleep(300);
              }
              await fetchPets();
              Alert.alert('Éxito', '¡Todas las mascotas han sido eliminadas!');
            } catch (e) {
              Alert.alert('Error', e.message || JSON.stringify(e));
            }
          }
        }
      ]
    );
  };

  // Utilidad para mapear edad numérica a opción del Picker
  const mapEdadToPicker = (edad) => {
    if (typeof edad === 'string') return edad;
    const n = Number(edad);
    if (isNaN(n)) return '';
    if (n <= 1) return 'cachorro';
    if (n <= 3) return 'joven';
    if (n <= 7) return 'adulto';
    if (n > 7) return 'senior';
    return '';
  };

  const PetCard = ({ pet }) => (
    <View style={styles.petCard}>
      <View style={styles.petHeader}>
        <View style={styles.petInfo}>
          <MaterialIcons 
            name={pet.tipo === 'perro' ? 'pets' : pet.tipo === 'gato' ? 'pets' : 'pets'} 
            size={24} 
            color={theme.primaryColor} 
          />
          <View style={styles.petDetails}>
            <Text style={styles.petName}>{pet.nombre}</Text>
            <Text style={styles.petType}>{pet.tipo} - {pet.raza}</Text>
          </View>
        </View>
        <Text style={styles.petId}>ID: {pet.id.slice(0, 8)}</Text>
      </View>

      <View style={styles.petContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dueño</Text>
          <Text style={styles.text}>{pet.ownerName || 'Sin nombre'}</Text>
          <Text style={styles.text}>{pet.ownerEmail}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <Text style={[styles.text, { color: pet.status === 'activo' ? theme.successGreen : theme.errorRed, fontWeight: 'bold' }]}>
            {pet.status === 'activo' ? 'Activo' : 'Rechazado'}
          </Text>
        </View>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primaryColor, marginTop: 10 }]} onPress={() => handleEditPet(pet)}>
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.errorRed, marginTop: 10 }]} onPress={() => handleDeletePet(pet)}>
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.petActions}>
        {pet.status === 'pendiente' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.successGreen }]}
              onPress={() => updatePetStatus(pet.id, 'activo')}
            >
              <Text style={styles.actionButtonText}>Activar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.errorRed }]}
              onPress={() => updatePetStatus(pet.id, 'rechazado')}
            >
              <Text style={styles.actionButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const TypeFilter = () => (
    <View style={styles.filterContainer}>
      {['todos', 'perro', 'gato', 'otro'].map(type => (
        <TouchableOpacity
          key={type}
          style={[
            styles.filterButton,
            typeFilter === type && styles.filterButtonActive
          ]}
          onPress={() => setTypeFilter(type)}
        >
          <Text style={[
            styles.filterButtonText,
            typeFilter === type && styles.filterButtonTextActive
          ]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Modal o pantalla de edición de mascota
  const EditPetModal = () => (
    editingPet && (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
        <View style={{ backgroundColor: theme.white, borderRadius: 12, padding: 20, width: 340, maxWidth: '90%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primaryColor, marginBottom: 10 }}>Editar Mascota</Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.inputWithBorder} value={editForm.nombre || ''} onChangeText={text => handleEditChange('nombre', text)} />
          <Text style={styles.label}>Tipo</Text>
          <TextInput style={styles.inputWithBorder} value={editForm.tipo || ''} onChangeText={text => handleEditChange('tipo', text)} />
          <Text style={styles.label}>Raza</Text>
          <TextInput style={styles.inputWithBorder} value={editForm.raza || ''} onChangeText={text => handleEditChange('raza', text)} />
          <Text style={styles.label}>Edad</Text>
          <Picker
            selectedValue={mapEdadToPicker(editForm.edad)}
            onValueChange={value => handleEditChange('edad', value)}
            style={styles.inputWithBorder}
          >
            <Picker.Item label="Selecciona edad" value="" />
            <Picker.Item label="Cachorro (0-1 año)" value="cachorro" />
            <Picker.Item label="Joven (1-3 años)" value="joven" />
            <Picker.Item label="Adulto (3-7 años)" value="adulto" />
            <Picker.Item label="Senior (7+ años)" value="senior" />
          </Picker>
          <Text style={styles.label}>Sexo</Text>
          <TextInput style={styles.inputWithBorder} value={editForm.sexo || ''} onChangeText={text => handleEditChange('sexo', text)} />
          <Text style={styles.label}>Enfermedades</Text>
          <TextInput style={styles.inputWithBorder} value={editForm.enfermedadesAnteriores || ''} onChangeText={text => handleEditChange('enfermedadesAnteriores', text)} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primaryColor, flex: 1 }]} onPress={handleSaveEdit} disabled={savingEdit}>
              <Text style={styles.actionButtonText}>{savingEdit ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.errorRed, flex: 1 }]} onPress={() => setEditingPet(null)}>
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  );

  // Modal de confirmación de borrado
  const DeletePetModal = () => (
    deleteModalVisible && (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
        <View style={{ backgroundColor: theme.white, borderRadius: 16, padding: 28, minWidth: 280, alignItems: 'center', borderWidth: 2, borderColor: theme.secondaryColor }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.secondaryColor, marginBottom: 20 }}>¿Qué deseas eliminar?</Text>
          {petsToDelete.length > 1 ? (
            <>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.errorRed, marginBottom: 10 }]} onPress={() => confirmDeletePet(false)} disabled={deleting}>
                <Text style={styles.actionButtonText}>Solo esta mascota</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.errorRed }]} onPress={() => confirmDeletePet(true)} disabled={deleting}>
                <Text style={styles.actionButtonText}>Todas las mascotas del presupuesto</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.errorRed }]} onPress={() => confirmDeletePet(false)} disabled={deleting}>
              <Text style={styles.actionButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.greyLight, marginTop: 10 }]} onPress={() => setDeleteModalVisible(false)}>
            <Text style={[styles.actionButtonText, { color: theme.dark }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
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
        <Text style={styles.title}>Gestión de Mascotas</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={theme.greyLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar mascotas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.greyLight}
        />
      </View>

      <TypeFilter />

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginHorizontal: 20, marginBottom: 10 }}>
        {userData?.role === 'admin' && (
          <TouchableOpacity style={{backgroundColor: 'red', padding: 10, borderRadius: 8, margin: 10}} onPress={handleDeleteAbsolutelyAllPets}>
            <Text style={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>Eliminar TODAS las mascotas</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.petsList}>
        {filteredPets.map(pet => (
          <PetCard key={pet.id} pet={pet} />
        ))}
        {filteredPets.length === 0 && (
          <Text style={styles.noResults}>No se encontraron mascotas</Text>
        )}
      </ScrollView>
      <EditPetModal />
      <DeletePetModal />
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
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
  petsList: {
    flex: 1,
    padding: 20,
  },
  petCard: {
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
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petDetails: {
    marginLeft: 15,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.dark,
  },
  petType: {
    fontSize: 14,
    color: theme.dark,
  },
  petId: {
    fontSize: 12,
    color: theme.dark,
  },
  petContent: {
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
  petActions: {
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
    color: theme.white,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: theme.dark,
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.dark,
    marginBottom: 5,
  },
  inputWithBorder: {
    backgroundColor: theme.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.dark,
    color: theme.dark,
  },
}); 