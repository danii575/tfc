// navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// Importamos las pantallas que usaremos en el Stack
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../app/login';
import PresupuestoScreen from '../app/presupuestoCards';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      {/* Pantalla de Login */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
        // headerShown false para ocultar la barra por defecto en pantalla de Login
      />
      {/* Pantalla Home (principal tras login) */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }} 
      />
      {/* Pantalla de Presupuesto */}
      <Stack.Screen 
        name="Presupuesto" 
        component={PresupuestoScreen} 
        options={{ title: 'Mi Presupuesto' }} 
      />
    </Stack.Navigator>
  );
}
