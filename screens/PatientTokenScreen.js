import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

function PatientTokenScreen() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchToken = async () => {
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado.');
        return;
      }
      const userRef = doc(firestore, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setToken(snap.data().pairingToken || 'No disponible');
      } else {
        Alert.alert('Error', 'Usuario no encontrado.');
      }
      setLoading(false);
    };
    fetchToken();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.text}>Cargando código...</Text>
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
        title="Ver código de cuidador"
        onPress={() => navigation.replace('PatientToken')}
        color="#6c757d"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20, backgroundColor:'#f5f5f5' },
  title: { fontSize:26, fontWeight:'bold', marginBottom:20, color:'#333' },
  token: { fontSize:36, fontWeight:'bold', color:'#007bff', marginBottom:20 },
  instructions: { fontSize:16, color:'#555', textAlign:'center', paddingHorizontal:20 },
  text: { fontSize:18, color:'#555', marginTop:15 },
  buttonSpacer: {
    height: 20,
  },
});

export default PatientTokenScreen;
