import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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

export default function AdminSettings() {
  const router = useRouter();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      newUsers: true,
      newBudgets: true,
      systemAlerts: true
    },
    security: {
      twoFactorAuth: false,
    },
  });

  useEffect(() => {
    if (!userData || userData.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchSettings();
  }, [userData]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'admin_settings', 'general'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      Alert.alert('Error', 'No se pudieron cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'admin_settings', 'general'), settings);
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const toggleSecurity = (key) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: !prev.security[key]
      }
    }));
  };

  const SettingSection = ({ title, icon, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={24} color={theme.primaryColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const SettingItem = ({ label, value, onToggle }) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.greyLight, true: theme.primaryColor }}
        thumbColor={theme.white}
      />
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
        <Text style={styles.title}>Configuración</Text>
        <TouchableOpacity
          style={{marginLeft: 'auto', backgroundColor: theme.primaryColor, padding: 8, borderRadius: 8}}
          onPress={() => router.push('/admin')}
        >
          <Text style={{color: theme.white, fontWeight: 'bold'}}>Menú principal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <SettingSection title="Notificaciones" icon="notifications">
          <SettingItem
            label="Nuevos usuarios"
            value={settings.notifications.newUsers}
            onToggle={() => toggleNotification('newUsers')}
          />
          <SettingItem
            label="Nuevos presupuestos"
            value={settings.notifications.newBudgets}
            onToggle={() => toggleNotification('newBudgets')}
          />
          <SettingItem
            label="Alertas del sistema"
            value={settings.notifications.systemAlerts}
            onToggle={() => toggleNotification('systemAlerts')}
          />
        </SettingSection>

        <SettingSection title="Seguridad" icon="security">
          <SettingItem
            label="Autenticación de dos factores"
            value={settings.security.twoFactorAuth}
            onToggle={() => toggleSecurity('twoFactorAuth')}
          />
        </SettingSection>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: 15,
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.dark,
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.greyLight,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.dark,
  },
  saveButton: {
    backgroundColor: theme.primaryColor,
    borderRadius: theme.borderRadius,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 