import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Button, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

function CaregiverLinkScreen({ navigation }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Por favor ingresa un token válido.');
      return;
    }

    setLoading(true);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado. Por favor, inicia sesión de nuevo.');
      navigation.replace('Login');
      setLoading(false);
      return;
    }

    try {
      const formattedToken = tokenInput.trim().toUpperCase();

      // 1. Buscar al paciente por el pairingToken en Firestore
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('pairingToken', '==', formattedToken), where('user_type', '==', 'patient'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'No se encontró ningún paciente con ese código de vinculación o el código es incorrecto.');
        setLoading(false);
        return;
      }

      const patientDoc = querySnapshot.docs[0];
      const patientUid = patientDoc.id;

      // 2. Verificar que el cuidador no esté ya vinculado a este paciente
      const caregiverPatientLinksRef = collection(firestore, 'caregiverPatientLinks');
      const existingLinkQuery = query(
        caregiverPatientLinksRef,
        where('caregiverUid', '==', currentUser.uid),
        where('patientUid', '==', patientUid)
      );
      const existingLinkSnapshot = await getDocs(existingLinkQuery);

      if (!existingLinkSnapshot.empty) {
        Alert.alert('Información', 'Ya estás vinculado a este paciente.');
        setLoading(false);
        navigation.goBack();
        return;
      }

      // 3. Crear el enlace en la colección caregiverPatientLinks en Firestore
      await addDoc(caregiverPatientLinksRef, {
        caregiverUid: currentUser.uid,
        patientUid: patientUid,
        linkedAt: Date.now(),
      });

      Alert.alert('Éxito', 'Has sido vinculado al paciente correctamente.');
      navigation.navigate('Dashboards'); // Recarga el dashboard para mostrar el nuevo paciente
    } catch (error) {
      console.error("Error al vincular cuidador con paciente en Firestore:", error);
      Alert.alert('Error', 'Hubo un problema al intentar vincular. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vincular con un Paciente</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa el código del paciente"
        value={tokenInput}
        onChangeText={setTokenInput}
        autoCapitalize="characters"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button title="Vincular" onPress={handleLink} color="#007bff" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
});

export default CaregiverLinkScreen;