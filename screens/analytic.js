// Analytic.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, Alert, Image } from 'react-native'; // Importa Image
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

// Define tus umbrales de trofeos y sus imágenes
const TROPHY_LEVELS = [
  { notesRequired: 1, image: require('../assets/trofeo1.png') }, // Asegúrate de tener estas imágenes
  { notesRequired: 5, image: require('../assets/trofeo2.png') },
  { notesRequired: 10, image: require('../assets/trofeo3.png') },
];

function Analytic({ route, navigation }) {
  const { patientUid: patientUidFromNavigation } = route.params || {};

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [currentPatientNotesCount, setCurrentPatientNotesCount] = useState(0); // Nuevo estado para el contador de notas

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado. Por favor, inicia sesión.');
      navigation.replace('Login');
      return;
    }

    const db = getFirestore();

    const determinePatientAndFetchNotes = async () => {
      let patientToFetchUid = null;
      let unsubscribeNotesCount = () => {}; // Variable para el listener del contador

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          Alert.alert('Error', 'Datos de usuario no encontrados en Firestore.');
          navigation.replace('Login');
          setLoading(false);
          return;
        }
        const userData = userDocSnap.data();
        setUserRole(userData.user_type);

        if (userData.user_type === 'patient') {
          patientToFetchUid = currentUser.uid;
        } else if (userData.user_type === 'caregiver') {
          if (patientUidFromNavigation) {
            patientToFetchUid = patientUidFromNavigation;
          } else {
            Alert.alert("Atención", "Selecciona un paciente desde el Dashboard para ver sus notas.");
            setLoading(false);
            setNotes([]);
            return;
          }
        } else {
          Alert.alert("Error", "Rol de usuario no reconocido.");
          setLoading(false);
          setNotes([]);
          return;
        }

        setCurrentPatientId(patientToFetchUid);
        if (!patientToFetchUid) {
          setLoading(false);
          setNotes([]);
          return;
        }

        // Escuchar notas
        const notesCollectionRef = collection(doc(db, 'users', patientToFetchUid), 'notes');
        const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribeNotes = onSnapshot(q, (querySnapshot) => {
          const fetchedNotes = [];
          querySnapshot.forEach(documentSnapshot => {
            fetchedNotes.push({
              id: documentSnapshot.id,
              ...documentSnapshot.data(),
            });
          });
          setNotes(fetchedNotes);
          setLoading(false);
        }, (error) => {
          console.error('Error al obtener las notas:', error);
          Alert.alert('Error', 'No se pudieron cargar las notas. Inténtalo de nuevo.');
          setLoading(false);
        });

        // **NUEVO: Escuchar cambios en el contador de notas del paciente que se está viendo**
        const patientDocRef = doc(db, 'users', patientToFetchUid);
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
          unsubscribeNotes();
          unsubscribeNotesCount(); // Limpiar el listener del contador de notas
        };
      } catch (error) {
        console.error('Error en determinePatientAndFetchNotes:', error);
        Alert.alert('Error', 'Ocurrió un error al cargar los datos.');
        navigation.replace('Login');
        setLoading(false);
      }
    };

    determinePatientAndFetchNotes();
  }, [patientUidFromNavigation, navigation]);

  // Función para obtener la imagen del trofeo (igual que en Dashboards.js)
  const getTrophyImage = (notesCount) => {
    const achievedTrophy = TROPHY_LEVELS
      .filter(level => notesCount >= level.notesRequired)
      .sort((a, b) => b.notesRequired - a.notesRequired)[0];

    return achievedTrophy ? achievedTrophy.image : null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando tus notas...</Text>
      </View>
    );
  }

  const trophyImage = getTrophyImage(currentPatientNotesCount);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {userRole === 'caregiver' ? 'Notas del Paciente' : 'Mis Notas Clínicas'}
      </Text>

      {/* **NUEVO: Mostrar el trofeo aquí si existe** */}
      {trophyImage && (
        <View style={styles.trophyContainer}>
          <Text style={styles.trophyTitle}>¡Trofeo de Notas!</Text>
          <Image source={trophyImage} style={styles.trophyImage} />
          <Text style={styles.trophyText}>Llevas {currentPatientNotesCount} notas escritas.</Text>
        </View>
      )}

      {notes.length === 0 ? (
        <Text style={styles.noNotesText}>
          {userRole === 'caregiver'
            ? 'Tu paciente aún no tiene notas.'
            : 'No tienes notas aún. ¡Crea una nueva!'}
        </Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.noteItem}>
              <Text style={styles.noteContent}>{item.content}</Text>
              {item.createdAt && (
                <Text style={styles.noteDate}>
                  {new Date(item.createdAt.toDate()).toLocaleString()}
                </Text>
              )}
              {item.analysis && (
                <View style={styles.analysisContainer}>
                  <Text style={styles.analysisTitle}>Análisis IA:</Text>
                  <Text style={styles.analysisText}>{item.analysis}</Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.notesList}
        />
      )}

      <View style={styles.buttonSpacer} />

      {userRole === 'patient' ? (
        <Button
          title='Volver a la sección de notas'
          onPress={() => navigation.replace('Notes')}
          color="#007bff"
        />
      ) : userRole === 'caregiver' ? (
        <Button
          title='Volver al inicio'
          onPress={() => navigation.replace('Dashboards')}
          color="#28a745"
        />
      ) : null}

      <View style={styles.buttonSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 25,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2c3e50',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  noNotesText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  notesList: {
    width: '100%',
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  noteItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  noteContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  buttonSpacer: {
    height: 20,
  },
  analysisContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 5,
  },
  analysisText: {
    fontSize: 14,
    color: '#555',
  },
  // Estilos para el trofeo
  trophyContainer: {
    alignItems: 'center',
    marginTop: 10, // Un poco menos de margen si va antes de las notas
    marginBottom: 20,
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

export default Analytic;