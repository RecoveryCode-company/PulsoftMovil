import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, Dimensions, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import { COLORS } from './colors';
import { ref, onValue, update, set } from 'firebase/database';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, database, firestore } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const TROPHY_LEVELS = [
  { notesRequired: 1, image: require('../assets/trofeo1.png') },
  { notesRequired: 5, image: require('../assets/trofeo2.png') },
  { notesRequired: 10, image: require('../assets/trofeo3.png') },
];

const { width } = Dimensions.get('window');

function Dashboards({ navigation }) {
  
  const [userRole, setUserRole] = useState(null);
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [currentPatientData, setCurrentPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [currentPatientNotesCount, setCurrentPatientNotesCount] = useState(0);
  const [panicModeState, setPanicModeState] = useState(false);
  const [currentAuthUserUid, setCurrentAuthUserUid] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setCurrentAuthUserUid(null);
        setUserRole(null);
        setLinkedPatients([]);
        setSelectedPatientId(null);
        setCurrentPatientData(null);
        setLoading(true); 
        navigation.replace('Login');
        return;
      }
      setCurrentAuthUserUid(currentUser.uid);
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

    if (currentAuthUserUid && selectedPatientId) { 
      const patientRef = ref(database, `patients/${selectedPatientId}`);

      // Inicialización del nodo si no existe
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

      unsubscribeRealtime = onValue(patientRef, (snapshot) => {   // Listener en tiempo real
        if (snapshot.exists()) {
          const d = snapshot.val();
          setCurrentPatientData({
            cardiovascular: d.cardiovascular || 0, 
            sudor: d.sudor || 0, 
            temperatura: d.temperatura || 0, 
          });
          setPanicModeState(d.panicMode || false); 
        } else {
          setCurrentPatientData({
            cardiovascular: 0,
            sudor: 0,
            temperatura: 0,
          });
          setPanicModeState(false);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error leyendo datos de Realtime Database:", error);
        Alert.alert("Error", "No se pudieron cargar los datos en tiempo real del paciente.");
        setLoading(false);
      });

      const patientDocRef = doc(firestore, 'users', selectedPatientId);   // Listener para el contador de notas
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

      return () => {
        unsubscribeInitialCheck();
        unsubscribeRealtime();
        unsubscribeNotesCount();
      };
    } else {
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

  if (loading) {   // DISEÑO
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
      <Text style={styles.title}>Dashboard</Text>
      
      {/* Lista de pacientes para el cuidador */}
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

      {/* Gráficas y datos en tiempo real */}
      <View style={styles.graphsRow}>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Cardiovascular</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>
              {currentPatientData ? currentPatientData.cardiovascular : '[Sin datos]'}
            </Text>
          </View>
        </View>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Sudor</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>
              {currentPatientData ? currentPatientData.sudor : '[Sin datos]'}
            </Text>
          </View>
        </View>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Temperatura</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>
              {currentPatientData ? currentPatientData.temperatura : '[Sin datos]'}
            </Text>
          </View>
        </View>
      </View>

      {/* Trofeo de notas */}
      {trophyImage && (
        <View style={styles.trophyContainer}>
          <Text style={styles.trophyTitle}>¡Trofeo de Notas!</Text>
          <Image source={trophyImage} style={styles.trophyImage} />
          <Text style={styles.trophyText}>Llevas {currentPatientNotesCount} notas escritas.</Text>
        </View>
      )}

      {/* Botón de pánico y acciones adicionales */}
      <View style={styles.actions}>
        {selectedPatientId && (
          <Button
            title={panicModeState ? "Desactivar Pánico" : "Activar Pánico"}
            onPress={togglePanicButton}
            color={panicModeState ? "#ffc107" : "#dc3545"}
          />
        )}

        {userRole === 'patient' && (
          <>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Notes')}
            >
              <Text style={styles.actionButtonText}>Ir a Notas</Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PatientToken')}
            >
              <Text style={styles.actionButtonText}>Ver código de cuidador</Text>
            </TouchableOpacity>
          </>
        )}
        {userRole === 'caregiver' && (
          <>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CaregiverLink')}
            >
              <Text style={styles.actionButtonText}>Vincular con paciente</Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (selectedPatientId) {
                  navigation.navigate('Analytic', { patientUid: selectedPatientId });
                } else {
                  Alert.alert("Atención", "Selecciona un paciente para ver sus notas.");
                }
              }}
            >
              <Text style={styles.actionButtonText}>Notas del paciente</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      {/* Cerrar sesión */}
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
    backgroundColor: COLORS.background,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 28,
    letterSpacing: 1,
    textAlign: 'center',
  },
  graphsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  graphCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: width * 0.28,
    minHeight: 130,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 11,
    elevation: 5,
    marginHorizontal: 3,
  },
  graphTitle: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 8,
  },
  graphPlaceholder: {
    backgroundColor: COLORS.accent,
    width: '100%',
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphPlaceholderText: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: width * 0.7,
    alignItems: 'center',
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.6,
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
});

export default Dashboards;