import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Video de fondo */}
      <Video
        source={require('../assets/skyWelcome.mp4')}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping
        isMuted={true}
        repeat
      />

      {/* Overlay degradado */}
      <LinearGradient
        colors={['rgb(255, 255, 255)', 'rgba(0, 0, 0, 0.33)']}
        style={styles.overlay}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Contenido encima del video */}
      <View style={styles.content}>
        {/* Logo centrado más grande */}
        <Image
          source={require('../assets/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Espaciado extra antes de Bienvenido */}
        <View style={{ height: 48 }} />

        {/* Texto Bienvenido */}
        <Text style={styles.title}>Bienvenido</Text>

        {/* Espaciado extra antes de los botones */}
        <View style={{ height: 64 }} />

        {/* Botón Iniciar Sesión */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('LoginScreen')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        {/* Botón Registrarse */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('RegisterScreen')}
          activeOpacity={0.85}
        >
          <Text style={styles.registerButtonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>

      {/* Footer: Powered by RecoveryCode */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by RecoveryCode</Text>
      </View>
    </View>
  );
};

const PRIMARY_BLUE = "#1976D2";
const ACCENT_BLUE = "#64B5F6";
const WHITE = "#FFFFFF";
const DARK_GRAY = "#222831";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 3,
    paddingTop: 110,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 100,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 3,
    textShadowColor: 'rgb(74, 74, 75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  loginButton: {
    width: width * 0.5,
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: '#2168A5',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.17,
    shadowRadius: 18,
    elevation: 6,
  },
  loginButtonText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerButton: {
    width: width * 0.4,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#152D66',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: ACCENT_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 3,
  },
  registerButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    width: '100%',
    alignItems: 'center',
    zIndex: 4,
  },
  footerText: {
    color: 'rgb(0, 0, 0)',
    fontSize: 17,
    opacity: 0.8,
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;