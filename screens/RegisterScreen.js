import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { COLORS } from './colors';

const { width } = Dimensions.get('window');

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // 1. Registrar usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Guardar rol y token (si aplica) en Firestore
      const firestoreUserData = {
        user_type: role, // Usamos 'user_type' para el rol
        email: email,
        createdAt: serverTimestamp(),
      };

      if (role === 'patient') {
        firestoreUserData.pairingToken = generateToken(6); // Generar token para pacientes
      }

      await setDoc(doc(firestore, 'users', user.uid), firestoreUserData);

      Alert.alert("¡Registro Exitoso!", "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.");
      navigation.navigate('Login');
    } catch (error) {
      let errorMessage = "Ocurrió un error al registrar el usuario.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "El correo electrónico ya está en uso.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "El formato del correo electrónico es inválido.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es demasiado débil.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Error de red. Verifica tu conexión a internet.";
      }
      Alert.alert("Error de Registro", errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        placeholderTextColor={COLORS.secondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={COLORS.secondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        placeholderTextColor={COLORS.secondary}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'patient' && styles.selectedRole]}
          onPress={() => setRole('patient')}
        >
          <Text style={[styles.roleText, role === 'patient' && { color: COLORS.white }]}>Paciente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'caregiver' && styles.selectedRole]}
          onPress={() => setRole('caregiver')}
        >
          <Text style={[styles.roleText, role === 'caregiver' && { color: COLORS.white }]}>Cuidador</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.replace('Login')}
        disabled={loading}
      >
        <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={{ color: COLORS.coral }}>Inicia sesión</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 32,
    letterSpacing: 1,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 410,
    height: 52,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    marginBottom: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    color: COLORS.text,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    justifyContent: 'center',
    width: '100%',
  },
  roleButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginHorizontal: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  selectedRole: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    width: width * 0.7,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkButton: {
    marginTop: 18,
  },
  linkText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;