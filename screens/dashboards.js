import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { auth, database, firestore } from '../firebaseConfig'; 
import { signOut } from 'firebase/auth'; 

function Dashboards({ navigation }) {
  const [userRole, setUserRole] = useState(null);
  const [linkedPatients, setLinkedPatients] = useState([]); // Para cuidadores: lista de pacientes vinculados (UIDs y emails)
  const [currentPatientData, setCurrentPatientData] = useState(null); // Datos del paciente que se está viendo
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null); // ID del paciente seleccionado por el cuidador

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigation.replace('Login'); 
      return;
    }

    const fetchUserDataAndPatients = async () => {
      try {
        // 1. Obtener el rol y el token (si es paciente) desde Firestore
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserRole(userData.user_type); 

          if (userData.user_type === 'patient') {
            setSelectedPatientId(currentUser.uid); // El paciente se monitorea a sí mismo
          } else if (userData.user_type === 'caregiver') {
            // 2. Si es cuidador, obtener la lista de pacientes vinculados de Firestore
            const caregiverPatientLinksRef = collection(firestore, 'caregiverPatientLinks');
            // Busca enlaces donde el caregiverUid sea el UID del cuidador actual
            const q = query(caregiverPatientLinksRef, where('caregiverUid', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);

            const fetchedPatients = [];
            for (const linkDoc of querySnapshot.docs) {
              const linkData = linkDoc.data();
              const patientUid = linkData.patientUid;
              
              // Obtener los detalles del paciente de su documento de usuario en Firestore
              const patientDocRef = doc(firestore, 'users', patientUid);
              const patientDocSnap = await getDoc(patientDocRef);

              if (patientDocSnap.exists()) {
                const patientData = patientDocSnap.data();
                fetchedPatients.push({
                  uid: patientUid,
                  email: patientData.email || 'Email no disponible', // Asegúrate de guardar email en el documento de usuario
                });
              }
            }
            setLinkedPatients(fetchedPatients); 
            if (fetchedPatients.length > 0) {
              setSelectedPatientId(fetchedPatients[0].uid); // Seleccionar el primer paciente por defecto
            } else {
              setLoading(false); // No hay pacientes, se termina la carga
            }
          }
        } else {
          Alert.alert("Error", "No se encontró el perfil de usuario en Firestore.");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario/pacientes desde Firestore:", error);
        Alert.alert("Error", "Hubo un problema al cargar tu información. Intenta de nuevo.");
        setLoading(false);
      }
    };

    fetchUserDataAndPatients();
  }, []); 

  useEffect(() => {
    let unsubscribeRealtime = () => {}; 

    if (selectedPatientId) {
      const patientRef = ref(database, `patients/${selectedPatientId}`);
      unsubscribeRealtime = onValue(patientRef, (snapshot) => {
        if (snapshot.exists()) {
          const d = snapshot.val();
          setCurrentPatientData({
            cardiovascular: d.cardiovascular,
            sudor: d.sudor,
            temperatura: d.temperatura,
          });
        } else {
          setCurrentPatientData({
            cardiovascular: 'N/A',
            sudor: 'N/A',
            temperatura: 'N/A',
          });
        }
        setLoading(false); // Datos cargados
      }, (error) => {
        console.error("Error leyendo datos de Realtime Database:", error);
        Alert.alert("Error", "No se pudieron cargar los datos en tiempo real del paciente.");
        setLoading(false);
      });
    } else if (userRole === 'caregiver' && linkedPatients.length === 0) {
      setLoading(false); // Si es cuidador y no tiene pacientes vinculados, no hay datos que cargar.
    }
    return () => unsubscribeRealtime(); 
  }, [selectedPatientId, userRole, linkedPatients]); 

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
    }
  };

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.patientItem, item.uid === selectedPatientId && styles.selectedPatientItem]}
      onPress={() => setSelectedPatientId(item.uid)}
    >
      <Text style={[styles.patientItemText, item.uid === selectedPatientId && { color: '#fff' }]}>
        {item.email || 'Paciente Desconocido'}
      </Text>
    </TouchableOpacity>
  );

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
      <Text style={styles.title}>Monitoreo</Text>

      {userRole === 'caregiver' && linkedPatients.length > 0 && (
        <View style={styles.patientListContainer}>
          <Text style={styles.sectionTitle}>Tus Pacientes:</Text>
          <FlatList
            data={linkedPatients}
            renderItem={renderPatientItem}
            keyExtractor={item => item.uid}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.patientFlatList}
          />
        </View>
      )}

      {selectedPatientId && currentPatientData ? (
        <>
          <Text style={styles.subtitle}>Datos en tiempo real:</Text>
          <Text style={styles.dataText}>Cardiovascular: {currentPatientData.cardiovascular}</Text>
          <Text style={styles.dataText}>Sudor: {currentPatientData.sudor}</Text>
          <Text style={styles.dataText}>Temperatura: {currentPatientData.temperatura}</Text>
        </>
      ) : (
        <Text style={styles.noPatientText}>
          {userRole === 'caregiver' ? 'No tienes pacientes vinculados o selecciona uno.' : 'Cargando datos del paciente...'}
        </Text>
      )}

      <View style={styles.buttonSpacer} />

      {userRole === 'patient' ? (
        <>
          <Button
            title="Escribir nota"
            onPress={() => navigation.navigate('Notes')} 
            color="#007bff"
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Ver código de cuidador"
            onPress={() => navigation.navigate('PatientToken')} 
            color="#6c757d"
          />
        </>
      ) : userRole === 'caregiver' ? (
        <>
          <Button
            title="Vincular con paciente"
            onPress={() => navigation.navigate('CaregiverLink')} 
            color="#28a745"
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Notas del paciente"
            onPress={() => {
              if (selectedPatientId) {
                navigation.navigate('Analytic', { patientUid: selectedPatientId });
              } else {
                Alert.alert("Atención", "Selecciona un paciente para ver sus notas.");
              }
            }}
            color="#007bff"
          />
        </>
      ) : null}

      <View style={styles.logoutButtonContainer}>
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          color="#dc3545" 
        />
      </View>
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
    fontSize: 24, 
    fontWeight: '700', 
    textAlign: 'center',
    marginBottom: 20, 
    color: '#2C3E50', 
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#34495E',
    textAlign: 'center', 
  },
  dataText: {
    fontSize: 16,
    marginBottom: 8, 
    color: '#2C3E50',
    textAlign: 'center', 
  },
  buttonSpacer: {
    height: 15, 
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  logoutButtonContainer: {
    marginTop: 30, 
    width: '100%', 
  },
  patientListContainer: {
    marginBottom: 20,
    maxHeight: 100, 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  patientFlatList: {
    paddingVertical: 5,
  },
  patientItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ECF0F1', 
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  selectedPatientItem: {
    backgroundColor: '#3498DB', 
    borderColor: '#2980B9',
  },
  patientItemText: {
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  noPatientText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Dashboards;