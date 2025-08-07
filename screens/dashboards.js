import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, FlatList, TouchableOpacity, Image, Modal } from 'react-native';
import { ref, onValue, update, set } from 'firebase/database';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, database, firestore } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

// Define tus umbrales de trofeos y sus imágenes
const TROPHY_LEVELS = [
  { notesRequired: 1, image: require('../assets/trofeo1.png') },
  { notesRequired: 5, image: require('../assets/trofeo2.png') },
  { notesRequired: 10, image: require('../assets/trofeo3.png') },
];

function Dashboards({ navigation }) {
  const [userRole, setUserRole] = useState(null);
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [currentPatientData, setCurrentPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [currentPatientNotesCount, setCurrentPatientNotesCount] = useState(0);
  const [panicModeState, setPanicModeState] = useState(false);
  const [currentAuthUserUid, setCurrentAuthUserUid] = useState(null);

  // Estado para mostrar alerta emergente
  const [showAlertModal, setShowAlertModal] = useState(false);

  // useEffect para manejar la autenticación y la configuración inicial de roles/pacientes
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setCurrentAuthUserUid(null); // Limpiar UID del usuario autenticado
        setUserRole(null);
        setLinkedPatients([]);
        setSelectedPatientId(null);
        setCurrentPatientData(null);
        setLoading(true);
        navigation.replace('Login');
        return;
      }

      setCurrentAuthUserUid(currentUser.uid); // Guardar UID del usuario autenticado

      try {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserRole(userData.user_type);

          if (userData.user_type === 'patient') {
            setSelectedPatientId(currentUser.uid);
          } else if (userData.user_type === 'caregiver') {
            const caregiverPatientLinksRef = collection(firestore, 'caregiverPatientLinks');
            const q = query(caregiverPatientLinksRef, where('caregiverUid', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);

            const fetchedPatients = [];
            for (const linkDoc of querySnapshot.docs) {
              const linkData = linkDoc.data();
              const patientUid = linkData.patientUid;

              const patientDocRef = doc(firestore, 'users', patientUid);
              const patientDocSnap = await getDoc(patientDocRef);

              if (patientDocSnap.exists()) {
                const patientData = patientDocSnap.data();
                fetchedPatients.push({
                  uid: patientUid,
                  email: patientData.email || 'Email no disponible',
                });
              }
            }
            setLinkedPatients(fetchedPatients);
            if (fetchedPatients.length > 0) {
              setSelectedPatientId(fetchedPatients[0].uid);
            } else {
              setLoading(false);
            }
          }
        } else {
          Alert.alert("Error", "No se encontró el perfil de usuario en Firestore.");
          setLoading(false);
          signOut(auth);
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario/pacientes desde Firestore:", error);
        Alert.alert("Error", "Hubo un problema al cargar tu información. Intenta de nuevo.");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeRealtime = () => {};
    let unsubscribeNotesCount = () => {};
    let unsubscribeInitialCheck = () => {};

    // Usar currentAuthUserUid en lugar de auth.currentUser
    if (currentAuthUserUid && selectedPatientId) {
      const patientRef = ref(database, `patients/${selectedPatientId}`);

      // Lógica para asegurar la existencia e inicialización del nodo del paciente
      unsubscribeInitialCheck = onValue(patientRef, (snapshot) => {
        const currentData = snapshot.val();
        if (!currentData) {
          set(patientRef, {
            cardiovascular: 0,
            sudor: 0,
            temperatura: 0,
            panicMode: false
          }).then(() => {
            console.log(`Nodo para ${selectedPatientId} creado/inicializado en Realtime Database.`);
          }).catch(e => console.error("Error al crear/inicializar nodo de paciente:", e));
        } else if (currentData.panicMode === undefined) {
          update(patientRef, { panicMode: false }).catch(e => console.error("Error al inicializar panicMode:", e));
        }
      }, { onlyOnce: true });

      // Ahora, nos suscribimos a los datos en tiempo real (incluido panicMode)
      unsubscribeRealtime = onValue(patientRef, (snapshot) => {
        if (snapshot.exists()) {
          const d = snapshot.val();
          setCurrentPatientData({
            cardiovascular: d.cardiovascular || 0,
            sudor: d.sudor || 0,
            temperatura: d.temperatura || 0,
          });
          setPanicModeState(d.panicMode || false);

          if (d.cardiovascular >= 100 && d.sudor >= 4000 && d.temperatura >= 15) {
            setShowAlertModal(true);
          } else {
            setShowAlertModal(false);
          }

        } else {
          setCurrentPatientData({
            cardiovascular: 0,
            sudor: 0,
            temperatura: 0,
          });
          setPanicModeState(false);
          setShowAlertModal(false);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error leyendo datos de Realtime Database:", error);
        Alert.alert("Error", "No se pudieron cargar los datos en tiempo real del paciente.");
        setLoading(false);
      });

      // Suscripción al contador de notas de Firestore
      const patientDocRef = doc(firestore, 'users', selectedPatientId);
      unsubscribeNotesCount = onSnapshot(patientDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentPatientNotesCount(data.notesCount || 0);
        } else {
          setCurrentPatientNotesCount(0);
        }
      }, (error) => {
        console.error("Error al obtener el contador de notas:", error);
      });

      // Función de limpieza: Se ejecuta cuando el componente se desmonta o las dependencias cambian
      return () => {
        unsubscribeInitialCheck();
        unsubscribeRealtime();
        unsubscribeNotesCount();
      };
    } else {
      // Si no hay currentAuthUserUid o selectedPatientId, aseguramos que loading esté en false
      if (userRole === 'caregiver' && linkedPatients.length === 0) {
        setLoading(false);
      } else if (currentAuthUserUid && !selectedPatientId && userRole === 'patient') {
        setLoading(true);
      } else {
        setLoading(false);
      }
    }
  }, [currentAuthUserUid, selectedPatientId, userRole, linkedPatients]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
    }
  };

  const getTrophyImage = (notesCount) => {
    const achievedTrophy = TROPHY_LEVELS
      .filter(level => notesCount >= level.notesRequired)
      .sort((a, b) => b.notesRequired - a.notesRequired)[0];

    return achievedTrophy ? achievedTrophy.image : null;
  };

  const togglePanicButton = async () => {
    if (!selectedPatientId) {
      Alert.alert("Error", "No hay un paciente seleccionado para activar el botón de pánico.");
      return;
    }

    const patientPanicRef = ref(database, `patients/${selectedPatientId}`);
    try {
      const newState = !panicModeState;
      await update(patientPanicRef, {
        panicMode: newState
      });
      Alert.alert("Botón de Pánico", `Estado de pánico para ${selectedPatientId} establecido en: ${newState ? 'ACTIVADO' : 'DESACTIVADO'}`);
    } catch (error) {
      console.error("Error al alternar el botón de pánico:", error);
      Alert.alert("Error", "No se pudo cambiar el estado del botón de pánico.");
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

  const trophyImage = getTrophyImage(currentPatientNotesCount);

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

          {trophyImage && (
            <View style={styles.trophyContainer}>
              <Text style={styles.trophyTitle}>¡Trofeo de Notas!</Text>
              <Image source={trophyImage} style={styles.trophyImage} />
              <Text style={styles.trophyText}>Llevas {currentPatientNotesCount} notas escritas.</Text>
            </View>
          )}

          <View style={styles.buttonSpacer} />
          <Button
            title={panicModeState ? "Desactivar Pánico" : "Activar Pánico"}
            onPress={togglePanicButton}
            color={panicModeState ? "#ffc107" : "#dc3545"}
          />
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

      {/* Modal de alerta emergente */}
      <Modal
        visible={showAlertModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.alertTitle}>Alerta</Text>
            <Text style={styles.alertMessage}>Un ataque de ansiedad detectado</Text>
            <Button title="Cerrar" onPress={() => setShowAlertModal(false)} color="#ff6666" />
          </View>
        </View>
      </Modal>
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
  trophyContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e6ffe6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#aaffaa',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  trophyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 10,
  },
  trophyImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  trophyText: {
    fontSize: 14,
    color: '#555',
  },
  // Estilos para el modal de alerta emergente
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#b22222', // rojo oscuro
    padding: 30,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 10,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default Dashboards;
