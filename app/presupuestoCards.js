// File: app/presupuestoCards.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Picker, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../firebase/firebaseConfig'; // Asegúrate que la ruta a firebaseConfig sea correcta
import { collection, addDoc } from 'firebase/firestore';

export default function PresupuestoForm() {
  const router = useRouter(); // Definir router aquí
  const [step, setStep] = useState(0);
  const [petData, setPetData] = useState({
    tipo: '',
    nombre: '',
    edad: '',
    raza: 'Mezcla',
    enfermedades: ''
  });
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
//hola 

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

  const saveData = async () => {
    try {
      await addDoc(collection(db, 'presupuestos'), {
        ...userData,
        mascota: petData,
        fecha: new Date().toISOString()
      });
      router.push('/presupuestoFinal'); // Ahora router está definido
    } catch (error) {
      alert('Error al guardar');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
      </View>

      {step === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tipo de Mascota</Text>
          <TouchableOpacity 
            style={[styles.petButton, petData.tipo === 'Perro' && styles.selectedPet]}
            onPress={() => setPetData({...petData, tipo: 'Perro'})}
          >
            <Text style={styles.petEmoji}>🐶</Text>
            <Text style={styles.petText}>Perro</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.petButton, petData.tipo === 'Gato' && styles.selectedPet]}
            onPress={() => setPetData({...petData, tipo: 'Gato'})}
          >
            <Text style={styles.petEmoji}>🐱</Text>
            <Text style={styles.petText}>Gato</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Añadir más pasos aquí */}
      {/* Por ejemplo, paso 1 para nombre de mascota */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nombre de tu Mascota</Text>
          <TextInput
            style={styles.input} // Necesitarás definir este estilo
            placeholder="Ej: Max, Luna..."
            value={petData.nombre}
            onChangeText={text => setPetData({...petData, nombre: text})}
          />
        </View>
      )}
      {/* ... y así sucesivamente para otros campos de petData y userData ... */}


      <View style={styles.buttonContainer}>
        {step > 0 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.buttonTextSecondary}>Atrás</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={step < 4 ? handleNext : saveData} // Ajustar el número de pasos
        >
          <Text style={styles.buttonText}>{step < 4 ? 'Siguiente' : 'Finalizar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8fafc'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 30
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f766e',
    borderRadius: 2
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    marginBottom: 20, // Añadido para separar cards si hay varias en la misma vista
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f766e',
    marginBottom: 20
  },
  petButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15
  },
  selectedPet: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdfa'
  },
  petEmoji: {
    fontSize: 30,
    marginRight: 15
  },
  petText: {
    fontSize: 18,
    color: '#0f766e'
  },
  input: { // Estilo básico para TextInput, puedes personalizarlo
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#0f766e',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5, // Reducido para que quepa mejor si hay dos botones
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#0f766e',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 5, // Reducido
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  buttonTextSecondary: {
    color: '#0f766e',
    fontWeight: '600',
    fontSize: 16
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-between' // Asegura espacio si solo hay un botón
  }
});