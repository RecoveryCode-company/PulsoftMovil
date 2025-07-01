import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { getFirestore, collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { auth } from '../firebaseConfig'; 

function Analytic({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const currentUser = auth.currentUser; 
    
    if (currentUser) {
      setUser(currentUser);
      const db = getFirestore();
      const userNotesCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'analisis_clinicos');
      const q = query(userNotesCollectionRef, orderBy('createdAt', 'desc'));
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
        Alert.alert('Error', 'No se pudieron cargar tus notas. Inténtalo de nuevo.');
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      Alert.alert('Error', 'No hay usuario autenticado para ver las notas. Por favor, inicia sesión.');
      navigation.navigate('Login');
      setLoading(false);
    }
  }, []);

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
      <Text style={styles.title}>Mis Notas Clínicas</Text>

      {notes.length === 0 ? (
        <Text style={styles.noNotesText}>No tienes notas aún. ¡Crea una nueva!</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.noteItem}>
              <Text style={styles.noteContent}>{item.content}</Text>
              {item.createdAt && ( 
                <Text style={styles.noteDate}>
                  {/* Firestore Timestamp tiene un método toDate() */}
                  {new Date(item.createdAt.toDate()).toLocaleString()}
                </Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.notesList} 
        />
      )}

      <View style={styles.buttonWrapper}>
        <Button
          title='Volver a la sección de notas'
          onPress={() => navigation.navigate('Notes')}
          color="#007bff"
        />
      </View>
      <View style={styles.buttonaPocer} />
            <Button
              title='Volver al inicio' 
              onPress={() => navigation.navigate('Dashboards')} 
              color="#28a745"
          />
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
  buttonWrapper: {
    width: '100%',
    marginTop: 20, 
    marginBottom: 20,
  },
  buttonaPocer:{
    height:15,
  }
});

export default Analytic;