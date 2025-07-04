import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const generateToken = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' o 'caregiver'
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
      <Text style={styles.title}>Registrarse</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'patient' && styles.selectedRole]}
          onPress={() => setRole('patient')}
        >
          <Text style={styles.roleText}>Paciente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'caregiver' && styles.selectedRole]}
          onPress={() => setRole('caregiver')}
        >
          <Text style={styles.roleText}>Cuidador</Text>
        </TouchableOpacity>
      </View>

      <Button
        title={loading ? "Registrando..." : "Registrarse"}
        onPress={handleRegister}
        disabled={loading}
        color="#28a745"
      />

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.replace('Login')}
        disabled={loading}
      >
        <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#007bff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  roleButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  selectedRole: {
    backgroundColor: '#007bff',
  },
  roleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;