import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { auth } from '../firebaseConfig';

const TROPHY_LEVELS = [
  { notesRequired: 1, image: require('../assets/trofeo1.png') },
  { notesRequired: 5, image: require('../assets/trofeo2.png') },
  { notesRequired: 10, image: require('../assets/trofeo3.png') },
];

function Analytic({ route, navigation }) {
  const { patientUid: patientUidFromNavigation } = route.params || {};

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [currentPatientNotesCount, setCurrentPatientNotesCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');

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
      let unsubscribeNotesCount = () => {};

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
          unsubscribeNotesCount();
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
        <Text style={styles.loadingText}>Cargando tus análisis...</Text>
      </View>
    );
  }

  const trophyImage = getTrophyImage(currentPatientNotesCount);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {userRole === 'caregiver' ? 'Análisis del Paciente' : 'Mis Notas'}
      </Text>

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
          data={
            userRole === 'caregiver'
              ? notes.filter(item => item.analisis_IA)
              : notes.filter(item => item.content)
          }
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.noteItem}>
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() => {
                  setSelectedContent(
                    userRole === 'caregiver' ? item.analisis_IA : item.content
                  );
                  setModalVisible(true);
                }}
              >
                <Text style={styles.analysisButtonText}>
                  {userRole === 'caregiver' ? 'Ver análisis completo' : 'Ver nota completa'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.notesList}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={styles.modalText}>{selectedContent}</Text>
            </ScrollView>
            <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    fontSize: 26,
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
    paddingBottom: 20,
  },
  noteItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 4,
  },
  analysisButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 10,
  },
  analysisButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  trophyContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e6ffe6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#aaffaa',
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
  buttonSpacer: {
    height: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  maxHeight: '90%',
  width: '100%',
  alignSelf: 'center',
  flexGrow: 1,
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCloseButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Analytic;
