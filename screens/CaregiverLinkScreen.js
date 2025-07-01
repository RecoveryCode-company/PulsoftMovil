import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Button, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { doc, setDoc, getDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';

function CaregiverLinkScreen({ navigation }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    } else {
      Alert.alert('Error', 'No hay usuario autenticado');
      navigation.navigate('Login');
    }
  }, []);

  const handleLink = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Por favor ingresa un token válido.');
      return;
    }

    setLoading(true);

    try {
      const q = query(collection(firestore, 'users'), where('pairingToken', '==', tokenInput.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const patientDoc = querySnapshot.docs[0];
        const patientId = patientDoc.id;

        await updateDoc(doc(firestore, 'users', userId), {
          linkedPatient: patientId,
        });

        Alert.alert('Éxito', 'Has sido vinculado al paciente correctamente.');
        navigation.navigate('Dashboards'); 
      } else {
        Alert.alert('Token inválido', 'No se encontró ningún paciente con ese código.');
      }
    } catch (error) {
      console.error("Error al vincular cuidador:", error);
      Alert.alert('Error', 'No se pudo completar la vinculación. Intenta más tarde.');
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
