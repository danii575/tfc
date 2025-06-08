import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  errorRed: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  borderRadius: 12,
};

export default function BudgetEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (id) fetchBudget();
  }, [id]);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'presupuestos', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBudget({ id: docSnap.id, ...docSnap.data() });
        setForm({ ...docSnap.data() });
      } else {
        Alert.alert('Error', 'Presupuesto no encontrado');
        router.back();
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el presupuesto');
      router.back();
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'presupuestos', id);
      await updateDoc(docRef, form);
      Alert.alert('Éxito', 'Presupuesto actualizado');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el presupuesto');
    }
    setSaving(false);
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={theme.primaryColor} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Editar Presupuesto</Text>
      <Text style={styles.label}>Nombre del Cliente</Text>
      <TextInput
        style={styles.input}
        value={form.ownerData?.nombre || ''}
        onChangeText={text => handleChange('ownerData', { ...form.ownerData, nombre: text })}
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={form.ownerData?.email || ''}
        onChangeText={text => handleChange('ownerData', { ...form.ownerData, email: text })}
      />
      <Text style={styles.label}>Plan Seleccionado</Text>
      <TextInput
        style={styles.input}
        value={form.planNombre || ''}
        onChangeText={text => handleChange('planNombre', text)}
      />
      <Text style={styles.label}>Precio Estimado</Text>
      <TextInput
        style={styles.input}
        value={form.precioEstimado || ''}
        onChangeText={text => handleChange('precioEstimado', text)}
        keyboardType="numeric"
      />
      {/* Estado solo editable si ya está aceptado o rechazado, si no, no se muestra nada */}
      {(form.status === 'aceptado' || form.status === 'rechazado') && (
        <>
          <Text style={styles.label}>Estado</Text>
          <TextInput
            style={styles.input}
            value={form.status || ''}
            onChangeText={text => handleChange('status', text)}
          />
        </>
      )}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.white },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.primaryColor, marginBottom: 20 },
  label: { fontSize: 15, color: theme.secondaryColor, marginTop: 15 },
  input: { borderWidth: 1, borderColor: theme.greyLight, borderRadius: 8, padding: 10, marginTop: 5, backgroundColor: theme.white },
  saveButton: { backgroundColor: theme.primaryColor, padding: 15, borderRadius: 8, marginTop: 30, alignItems: 'center' },
  saveButtonText: { color: theme.white, fontWeight: 'bold', fontSize: 16 },
  cancelButton: { backgroundColor: theme.greyLight, padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  cancelButtonText: { color: theme.dark, fontWeight: 'bold', fontSize: 15 },
}); 