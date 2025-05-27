// screens/HomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser; // Usuario actualmente autenticado (puede ser null si no logueado)

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Hola, { user ? user.email : 'usuario' } 👋
      </Text>
      <Text style={styles.info}>
        Esta es la pantalla principal de tu app.
      </Text>
      {/* Bot\u00f3n para ir a la pantalla de Presupuesto */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Presupuesto')}>
        <Text style={styles.buttonText}>Ver mi Presupuesto</Text>
      </TouchableOpacity>
      {/* Bot\u00f3n para Cerrar sesi\u00f3n */}
      <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesi\u00f3n</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  welcome: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2e7d32' // verde oscuro
  },
  info: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555'
  },
  button: {
    width: '60%',
    padding: 10,
    backgroundColor: '#4caf50',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5
  },
  buttonText: {
    color: '#fff', 
    fontSize: 16
  },
  buttonOutline: {
    backgroundColor: '#c62828', // rojo oscuro para el logout, indicando acci\u00f3n de salir
  }
});
