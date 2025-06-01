import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';

// --- Paleta de Colores ---
const theme = {
  primaryColor: "#2A9D8F",
  secondaryColor: "#264653",
  accentColor: "#E9C46A",
  mutedPrimary: "#A8DADC",
  offWhite: '#FAF7F2',
  white: "#FFFFFF",
  greyLight: "#E9ECEF",
  dark: "#343a40",
  greyMedium: "#6c757d",
};

// --- Tipografía ---
const typography = {
  heading3: {
    fontSize: 19,
    fontWeight: "600",
    color: theme.secondaryColor,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    color: theme.dark,
    lineHeight: 26,
    textAlign: "center",
  },
  caption: {
    fontSize: 14,
    color: theme.greyMedium,
    textAlign: "center",
  },
};

// --- Espaciado ---
const spacing = {
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
  ultraLarge: 48,
};

const FooterLink = ({ onPress, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => Platform.OS === 'web' && setIsHovered(true);
  const handleMouseLeave = () => Platform.OS === 'web' && setIsHovered(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ paddingVertical: spacing.small / 2 }}
    >
      <Text style={[styles.footerLink, isHovered && styles.footerLinkHover]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const Footer = React.forwardRef((props, ref) => (
  <View ref={ref} style={[styles.footerBase, { backgroundColor: theme.secondaryColor }]}>
    <View style={styles.footerContent}>
      <View style={styles.footerColumn}>
        <Text style={styles.footerTitle}>🐾 PetCareSeguros</Text>
        <Text style={styles.footerText}>
          Protección y tranquilidad para ti y tu mascota. Cuidado experto al alcance de tu mano.
        </Text>
      </View>
      <View style={styles.footerColumn}>
        <Text style={styles.footerTitle}>Navegación</Text>
        <FooterLink onPress={() => props.onNavigateToPlans && props.onNavigateToPlans()}>Planes</FooterLink>
        <FooterLink onPress={() => props.onNavigateToAbout && props.onNavigateToAbout()}>Sobre Nosotros</FooterLink>
        <FooterLink onPress={() => props.onNavigateToServices && props.onNavigateToServices()}>Servicios</FooterLink>
        <FooterLink onPress={() => props.onNavigateToContact && props.onNavigateToContact()}>Contacto</FooterLink>
      </View>
      <View style={styles.footerColumn}>
        <Text style={styles.footerTitle}>Legal</Text>
        <FooterLink onPress={() => console.log("T&C footer pressed")}>Términos y Condiciones</FooterLink>
        <FooterLink onPress={() => console.log("Privacy footer pressed")}>Política de Privacidad</FooterLink>
        <FooterLink onPress={() => console.log("Cookies footer pressed")}>Política de Cookies</FooterLink>
      </View>
      <View style={styles.footerColumn}>
        <Text style={styles.footerTitle}>Contacto</Text>
        <Text style={styles.footerText}>📧 info@petcareseguros.com</Text>
        <Text style={styles.footerText}>📞 +34 900 123 456</Text>
        <Text style={styles.footerText}>📍 Calle Falsa 123, Madrid</Text>
        <Text style={styles.footerText}>⏰ Lu-Vi: 9:00 - 20:00</Text>
      </View>
    </View>
    <View style={styles.copyrightContainer}>
      <Text style={styles.copyright}>
        © {new Date().getFullYear()} PetCareSeguros S.L. Todos los derechos reservados.
      </Text>
    </View>
  </View>
));

const styles = StyleSheet.create({
  footerBase: {
    paddingTop: spacing.ultraLarge,
    paddingBottom: spacing.medium,
    width: "100%",
    alignItems: "center",
    backgroundColor: theme.secondaryColor,
  },
  footerContent: {
    width: "100%",
    maxWidth: 1400,
    paddingHorizontal: spacing.large,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: spacing.medium,
    marginBottom: spacing.large,
  },
  footerColumn: {
    alignItems: "flex-start",
    minWidth: Platform.OS === "web" ? 220 : "45%",
    flexGrow: 1,
    flexBasis: Platform.OS === "web" ? 220 : "45%",
    paddingHorizontal: spacing.small,
    marginBottom: spacing.medium,
  },
  footerTitle: {
    ...typography.heading3,
    fontSize: 19,
    color: theme.white,
    marginBottom: spacing.medium,
    textAlign: "left",
  },
  footerText: {
    ...typography.body,
    fontSize: 15,
    color: theme.greyLight,
    marginBottom: spacing.small,
    textAlign: "left",
    lineHeight: 24,
  },
  footerLink: {
    ...typography.body,
    fontSize: 15,
    color: theme.white,
    marginBottom: spacing.small,
    textAlign: "left",
    opacity: 0.85,
    fontWeight: '500',
    ...(Platform.OS === 'web' && { transition: 'opacity 0.2s ease-in-out, color 0.2s ease-in-out' }),
  },
  footerLinkHover: {
    opacity: 1,
    color: theme.primaryColor,
  },
  copyrightContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    marginTop: spacing.medium,
    alignItems: 'center',
  },
  copyright: {
    ...typography.caption,
    fontSize: 14,
    color: theme.greyMedium,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: spacing.large,
    opacity: 0.9,
  },
});

export default Footer; 