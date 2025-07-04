import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button, Clipboard } from 'react-native';
import { firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function PatientTokenScreen({ navigation }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Usuario no autenticado.');
        navigation.replace('Login');
        return;
      }

      const userDocRef = doc(firestore, 'users', currentUser.uid);
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const userData = snap.data();
          if (userData.user_type === 'patient') { // Usa 'user_type' para el rol
            setToken(userData.pairingToken || 'No disponible');
          } else {
            Alert.alert('Acceso Denegado', 'Esta pantalla es solo para usuarios tipo Paciente.');
            navigation.replace('Dashboards');
            return;
          }
        } else {
          Alert.alert('Error', 'Usuario no encontrado en Firestore.');
          setToken('No disponible');
        }
      } catch (error) {
        console.error("Error al obtener el token de Firestore:", error);
        Alert.alert('Error', 'Hubo un problema al cargar tu código.');
        setToken('Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  const copyToClipboard = () => {
    if (token && token !== 'No disponible' && token !== 'Error al cargar') {
      Clipboard.setString(token);
      Alert.alert('Copiado', 'El código ha sido copiado al portapapeles.');
    } else {
      Alert.alert('Error', 'No hay un código válido para copiar.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.text}>Cargando código...</Text>
        <Text>Si no es paciente, esta pantalla no se mostrará.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu código de vinculación</Text>
      <Text style={styles.token}>{token}</Text>
      <Text style={styles.instructions}>
        Compártelo con tu cuidador para que pueda acceder a tus datos.
      </Text>

      <View style={styles.buttonSpacer} />

      <Button
        title="Copiar Código"
        onPress={copyToClipboard}
        color="#28a745"
      />

      <View style={styles.buttonSpacer} />

      <Button
        title="Volver al inicio"
        onPress={() => navigation.replace('Dashboards')}
        color="#6c757d"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  token: { fontSize: 36, fontWeight: 'bold', color: '#007bff', marginBottom: 20 },
  instructions: { fontSize: 16, color: '#555', textAlign: 'center', paddingHorizontal: 20 },
  text: { fontSize: 18, color: '#555', marginTop: 15 },
  buttonSpacer: {
    height: 20,
  },
});

export default PatientTokenScreen;