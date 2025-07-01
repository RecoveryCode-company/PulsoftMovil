import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { auth, database, firestore } from '../firebaseConfig';

function Dashboards({ navigation }) {
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState('');
  const [patientData, setPatientData] = useState({
    cardiovascular: 'Cargando...',
    sudor: 'Cargando...',
    temperatura: 'Cargando...',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const fetchUserData = async () => {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserRole(data.role);

        // Si es paciente, usa su propio ID
        let patientId = currentUser.uid;

        if (data.role === 'paciente') {
          setToken(data.pairingToken || 'No asignado');
        }
        if (data.role === 'cuidador') {
          if (data.linkedPatient) {
            patientId = data.linkedPatient;
          } else {
            setLoading(false);
            return; 
          }
        }

        // Escuchar los datos del paciente (Realtime DB)
        const patientRef = ref(database, `patients/${patientId}`);
        onValue(patientRef, (snapshot) => {
          if (snapshot.exists()) {
            const d = snapshot.val();
            setPatientData({
              cardiovascular: d.cardiovascular,
              sudor: d.sudor,
              temperatura: d.temperatura,
            });
          } else {
            setPatientData({
              cardiovascular: 'N/A',
              sudor: 'N/A',
              temperatura: 'N/A',
            });
          }
          setLoading(false);
        });
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monitoreo del Paciente</Text>
      <Text style={styles.dataText}>Cardiovascular: {patientData.cardiovascular}</Text>
      <Text style={styles.dataText}>Sudor: {patientData.sudor}</Text>
      <Text style={styles.dataText}>Temperatura: {patientData.temperatura}</Text>

      <View style={styles.buttonSpacer} />

      {userRole === 'paciente' ? (
        <>
          <Button
            title="Escribir nota"
            onPress={() => navigation.replace('Notes')}
            color="#007bff"
          />
          <Button
            title="Escribir nota"
            onPress={() => navigation.replace('Analytic')}
            color="#007bff"
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Ver código de cuidador"
            onPress={() => navigation.replace('PatientToken')}
            color="#6c757d"
          />
        </>
      ) : userRole === 'cuidador' ? (
        <>
          <Button
            title="Vincular con paciente"
            onPress={() => navigation.replace('CaregiverLink')}
            color="#28a745"
          />
          <Button
            title="Escribir nota"
            onPress={() => navigation.replace('Analytic')}
            color="#007bff"
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#000',
  },
  dataText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
  },
  buttonSpacer: {
    height: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});

export default Dashboards;
