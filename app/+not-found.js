import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icono de error */}
        <MaterialIcons 
          name="search-off" 
          size={120} 
          color="#E76F51" 
          style={styles.icon}
        />
        
        {/* Código de error */}
        <Text style={styles.errorCode}>404</Text>
        
        {/* Título */}
        <Text style={styles.title}>Página No Encontrada</Text>
        
        {/* Mensaje */}
        <Text style={styles.message}>
          La página que buscas no existe o ha sido movida.
        </Text>
        
        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => router.replace('/')}
          >
            <MaterialIcons name="home" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#2A9D8F" />
            <Text style={styles.secondaryButtonText}>Página Anterior</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    marginBottom: 20,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#E76F51',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#264653',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#2A9D8F',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2A9D8F',
    fontSize: 16,
    fontWeight: '600',
  },
}); 