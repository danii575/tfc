// components/MiBotonPersonalizado.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function MiBotonPersonalizado({ titulo, onPress, tipo = 'primary' }) {
  return (
    <TouchableOpacity 
      style={[styles.button, tipo === 'secondary' && styles.buttonSecondary]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{titulo}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5
  },
  buttonSecondary: {
    backgroundColor: '#8bc34a'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
