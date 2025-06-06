import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Linking, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getAuth, updateEmail, updateProfile } from 'firebase/auth';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './_layout';

const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  errorRed: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  borderRadius: 12,
};

const sections = [
  { key: 'datos', label: 'Datos personales', icon: 'person' },
  { key: 'pagos', label: 'Formas de pago', icon: 'credit-card' },
  { key: 'facturas', label: 'Facturas', icon: 'receipt' },
  { key: 'mascotas', label: 'Mascotas', icon: 'pets' },
  { key: 'soporte', label: 'Soporte', icon: 'help-outline' },
];

export default function PerfilUsuario() {
  const router = useRouter();
  const { currentUser, userData, isLoadingAuth } = useAuth();
  const [activeSection, setActiveSection] = useState('datos');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  // Añadir campos de datosCompletos
  const datosCompletos = userData?.datosCompletos || {};
  const [form, setForm] = useState({
    nombre: userData?.nombreCompleto || userData?.nombre || '',
    email: currentUser?.email || '',
    telefono: userData?.telefono || '',
    tipoDocumento: datosCompletos.tipoDocumento || '',
    numeroDocumento: datosCompletos.numeroDocumento || '',
    fechaNacimiento: datosCompletos.fechaNacimiento || '',
    tipoVia: datosCompletos.tipoVia || '',
    nombreVia: datosCompletos.nombreVia || '',
    numero: datosCompletos.numero || '',
    piso: datosCompletos.piso || '',
    puerta: datosCompletos.puerta || '',
    escalera: datosCompletos.escalera || '',
    codigoPostal: datosCompletos.codigoPostal || '',
    provincia: datosCompletos.provincia || '',
    comunidadAutonoma: datosCompletos.comunidadAutonoma || ''
  });

  // Solo mostrar mascotas reales, sin ejemplos
  const mascotas = userData?.mascotas || [];
  const facturas = (userData?.mascotas || []).map((m, idx) => ({
    id: `F-${idx + 1}`,
    fecha: m.fechaAlta || '2024-06-01',
    concepto: `Seguro de ${m.nombre}`,
    estado: 'Pagada',
    url: null
  }));
  const formaPago = userData?.pago || { tipo: 'Tarjeta', numero: '**** **** **** 1234', titular: 'D. Usuario' };

  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      router.replace('/login');
    } else if (currentUser && userData) {
      setForm({
        nombre: userData.nombreCompleto || userData.nombre || '',
        email: currentUser.email || '',
        telefono: userData.telefono || '',
        tipoDocumento: datosCompletos.tipoDocumento || '',
        numeroDocumento: datosCompletos.numeroDocumento || '',
        fechaNacimiento: datosCompletos.fechaNacimiento || '',
        tipoVia: datosCompletos.tipoVia || '',
        nombreVia: datosCompletos.nombreVia || '',
        numero: datosCompletos.numero || '',
        piso: datosCompletos.piso || '',
        puerta: datosCompletos.puerta || '',
        escalera: datosCompletos.escalera || '',
        codigoPostal: datosCompletos.codigoPostal || '',
        provincia: datosCompletos.provincia || '',
        comunidadAutonoma: datosCompletos.comunidadAutonoma || ''
      });
    }
  }, [currentUser, userData, isLoadingAuth]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      if (form.email !== currentUser.email) {
        await updateEmail(currentUser, form.email);
      }
      await updateProfile(currentUser, { displayName: form.nombre });
      if (userData?.uid) {
        await updateDoc(doc(db, 'usuarios', userData.uid), {
          nombreCompleto: form.nombre,
          telefono: form.telefono,
          datosCompletos: {
            tipoDocumento: form.tipoDocumento,
            numeroDocumento: form.numeroDocumento,
            fechaNacimiento: form.fechaNacimiento,
            tipoVia: form.tipoVia,
            nombreVia: form.nombreVia,
            numero: form.numero,
            piso: form.piso,
            puerta: form.puerta,
            escalera: form.escalera,
            codigoPostal: form.codigoPostal,
            provincia: form.provincia,
            comunidadAutonoma: form.comunidadAutonoma,
          },
          ultimaActualizacion: new Date().toISOString(),
        });
      }
      Alert.alert('Datos actualizados', 'Tus datos se han guardado correctamente.');
      setEditMode(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudieron guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  // Handler para eliminar mascota (contactar por correo)
  const handleEliminarMascota = () => {
    Alert.alert(
      'Eliminar mascota del seguro',
      'Para eliminar una mascota de tu póliza de seguro, necesitas contactar con nuestro equipo de atención al cliente.\n\nPor favor, envía un correo a:\nsoporte@petcareseguros.com\n\nIndica en el correo el nombre de la mascota que deseas eliminar y tu número de póliza.',
      [
        { text: 'Entendido', style: 'default' },
      ]
    );
  };

  if (isLoadingAuth || !currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.white }}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.greyLight }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={() => router.replace('/')}> 
          <MaterialIcons name="home" size={28} color={theme.primaryColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.sectionsBar}>
        {sections.map(sec => (
          <TouchableOpacity key={sec.key} style={[styles.sectionTab, activeSection === sec.key && styles.sectionTabActive]} onPress={() => setActiveSection(sec.key)}>
            <MaterialIcons name={sec.icon} size={22} color={activeSection === sec.key ? theme.primaryColor : theme.dark} />
            {!isMobile && (
              <Text style={[styles.sectionTabText, activeSection === sec.key && { color: theme.primaryColor }]}>{sec.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {activeSection === 'datos' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos personales</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={[styles.input, !editMode && styles.inputDisabled]}
                value={form.nombre}
                onChangeText={text => handleChange('nombre', text)}
                editable={editMode}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, !editMode && styles.inputDisabled]}
                value={form.email}
                onChangeText={text => handleChange('email', text)}
                editable={editMode}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={[styles.input, !editMode && styles.inputDisabled]}
                value={form.telefono}
                onChangeText={text => handleChange('telefono', text)}
                editable={editMode}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Documento</Text>
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.tipoDocumento} onChangeText={text => handleChange('tipoDocumento', text)} editable={editMode} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de Documento</Text>
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.numeroDocumento} onChangeText={text => handleChange('numeroDocumento', text)} editable={editMode} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.fechaNacimiento} onChangeText={text => handleChange('fechaNacimiento', text)} editable={editMode} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.tipoVia} onChangeText={text => handleChange('tipoVia', text)} editable={editMode} placeholder="Tipo de vía" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.nombreVia} onChangeText={text => handleChange('nombreVia', text)} editable={editMode} placeholder="Nombre de la vía" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.numero} onChangeText={text => handleChange('numero', text)} editable={editMode} placeholder="Número" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.piso} onChangeText={text => handleChange('piso', text)} editable={editMode} placeholder="Piso" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.puerta} onChangeText={text => handleChange('puerta', text)} editable={editMode} placeholder="Puerta" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.escalera} onChangeText={text => handleChange('escalera', text)} editable={editMode} placeholder="Escalera" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.codigoPostal} onChangeText={text => handleChange('codigoPostal', text)} editable={editMode} placeholder="Código Postal" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.provincia} onChangeText={text => handleChange('provincia', text)} editable={editMode} placeholder="Provincia" />
              <TextInput style={[styles.input, !editMode && styles.inputDisabled]} value={form.comunidadAutonoma} onChangeText={text => handleChange('comunidadAutonoma', text)} editable={editMode} placeholder="Comunidad Autónoma" />
            </View>
            {editMode ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                  <Text style={styles.saveButtonText}>{loading ? 'Guardando...' : 'Guardar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditMode(false)}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
                <MaterialIcons name="edit" size={20} color={theme.primaryColor} />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {activeSection === 'pagos' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Forma de pago</Text>
            <Text style={{ fontWeight: 'bold', color: theme.primaryColor }}>{formaPago.tipo}</Text>
            <Text style={{ color: theme.secondaryColor, fontSize: 15 }}>Número: {formaPago.numero}</Text>
            <Text style={{ color: theme.secondaryColor, fontSize: 15 }}>Titular: {formaPago.titular}</Text>
            <Text style={{ color: theme.secondaryColor, fontSize: 13, marginTop: 10 }}>
              Si deseas cambiar tu forma de pago, contacta con soporte o accede a la sección de pagos en tu área privada.
            </Text>
          </View>
        )}
        {activeSection === 'facturas' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Facturas</Text>
            {facturas.length === 0 ? (
              <Text>No hay facturas disponibles.</Text>
            ) : (
              facturas.map(f => (
                <View key={f.id} style={{ borderBottomWidth: 1, borderBottomColor: theme.greyLight, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold', color: theme.primaryColor }}>#{f.id} - {f.concepto}</Text>
                    <Text style={{ color: theme.secondaryColor, fontSize: 13 }}>Fecha: {f.fecha}</Text>
                    <Text style={{ color: theme.secondaryColor, fontSize: 13 }}>Estado: {f.estado}</Text>
                  </View>
                  {f.url ? (
                    <TouchableOpacity onPress={() => Linking.openURL(f.url)} style={{ padding: 8 }}>
                      <MaterialIcons name="download" size={22} color={theme.primaryColor} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
        {activeSection === 'mascotas' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mascotas aseguradas</Text>
            {mascotas.length === 0 ? (
              <Text>No tienes mascotas aseguradas actualmente.</Text>
            ) : (
              mascotas.map((m, idx) => (
                <View key={idx} style={{ borderBottomWidth: 1, borderBottomColor: theme.greyLight, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold', color: theme.primaryColor }}>{m.nombre}</Text>
                    <Text style={{ color: theme.secondaryColor, fontSize: 13 }}>{m.tipo} - {m.raza}</Text>
                    <Text style={{ color: theme.secondaryColor, fontSize: 13 }}>Chip: {m.chip}</Text>
                    <Text style={{ color: theme.secondaryColor, fontSize: 13 }}>Póliza: {m.poliza} ({m.estado})</Text>
                  </View>
                  <TouchableOpacity onPress={handleEliminarMascota} style={{ padding: 8 }}>
                    <MaterialIcons name="delete" size={22} color={theme.errorRed} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
        {activeSection === 'soporte' && (
          <View style={styles.card}><Text style={styles.cardTitle}>Soporte y ayuda</Text><Text>¿Tienes dudas? Contáctanos en soporte@petcareseguros.com</Text></View>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={() => { getAuth().signOut(); router.replace('/'); }}>
          <MaterialIcons name="logout" size={22} color={theme.errorRed} />
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: theme.white, borderBottomWidth: 1, borderBottomColor: theme.greyLight },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.primaryColor },
  sectionsBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.white, borderBottomWidth: 1, borderBottomColor: theme.greyLight },
  sectionTab: { flex: 1, alignItems: 'center', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  sectionTabActive: { borderBottomWidth: 3, borderBottomColor: theme.primaryColor, backgroundColor: theme.greyLight },
  sectionTabText: { fontSize: 15, color: theme.dark, marginLeft: 4 },
  contentContainer: { padding: 18, alignItems: 'center' },
  card: { backgroundColor: theme.white, borderRadius: theme.borderRadius, padding: 20, width: '100%', maxWidth: 420, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.secondaryColor, marginBottom: 18 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: theme.secondaryColor, marginBottom: 4 },
  input: { backgroundColor: theme.greyLight, borderRadius: 8, padding: 10, fontSize: 15, color: theme.dark },
  inputDisabled: { backgroundColor: '#f5f5f5', color: '#888' },
  editButton: { flexDirection: 'row', alignItems: 'center', marginTop: 18, alignSelf: 'flex-end' },
  editButtonText: { color: theme.primaryColor, fontWeight: 'bold', marginLeft: 6 },
  saveButton: { backgroundColor: theme.primaryColor, padding: 10, borderRadius: 8 },
  saveButtonText: { color: theme.white, fontWeight: 'bold' },
  cancelButton: { backgroundColor: theme.greyLight, padding: 10, borderRadius: 8 },
  cancelButtonText: { color: theme.dark, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', marginTop: 30, alignSelf: 'center', gap: 8 },
  logoutButtonText: { color: theme.errorRed, fontWeight: 'bold', fontSize: 16 },
}); 