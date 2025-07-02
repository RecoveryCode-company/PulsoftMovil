import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

function Analytic({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado. Por favor, inicia sesión.');
      navigation.replace('Login');
      return;
    }

    const fetchUserDataAndNotes = async () => {
      try {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserRole(userData.role);

          let notesCollectionRef;
          if (userData.role === 'paciente') {
            notesCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'analisis_clinicos');
          } else if (userData.role === 'cuidador' && userData.linkedPatient) {
            notesCollectionRef = collection(doc(collection(db, 'users'), userData.linkedPatient), 'analisis_clinicos');
          } else {
            setLoading(false);
            setNotes([]);
            return;
          }

          const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
          return () => unsubscribe();
        } else {
          Alert.alert('Error', 'Datos de usuario no encontrados.');
          navigation.replace('Login');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al obtener datos de usuario o notas:', error);
        Alert.alert('Error', 'Ocurrió un error al cargar los datos.');
        navigation.replace('Login');
        setLoading(false);
      }
    };

    fetchUserDataAndNotes();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando tus notas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {userRole === 'cuidador' ? 'Notas del Paciente' : 'Mis Notas Clínicas'}
      </Text>

      {notes.length === 0 ? (
        // Mensaje condicional basado en el rol del usuario
        <Text style={styles.noNotesText}>
          {userRole === 'cuidador'
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
            </View>
          )}
          contentContainerStyle={styles.notesList}
        />
      )}

      <View style={styles.buttonSpacer} />

      {userRole === 'paciente' ? (
        <Button
          title='Volver a la sección de notas'
          onPress={() => navigation.replace('Notes')}
          color="#007bff"
        />
      ) : userRole === 'cuidador' ? (
        <Button
          title='Volver al inicio'
          onPress={() => navigation.replace('Dashboards')}
          color="#28a745"
        />
      ) : null}

      <View style={styles.buttonSpacer} />

      <View style={styles.logoutButtonContainer}>
      </View>
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
  logoutButtonContainer: {
    marginTop: 20,
    width: '100%',
  },
});

export default Analytic;