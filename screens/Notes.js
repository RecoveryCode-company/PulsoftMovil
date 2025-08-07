// Notes.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore'; // Importa updateDoc e increment
import axios from 'axios';

function Notes({ navigation }) {
  const [noteText, setNoteText] = useState('');
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado. Por favor, inicia sesión.');
      navigation.navigate('Login');
      return;
    }
    setUser(currentUser);

    const fetchUserRole = async () => {
      try {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().user_type);
        }
      } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
        Alert.alert("Error", "No se pudo cargar tu rol de usuario.");
      }
    };
    fetchUserRole();
  }, []);

  const onChangeNoteText = (text) => {
    setNoteText(text);
  };

  const handleSendNote = async () => {
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado para guardar la nota.');
      return;
    }

    if (noteText.trim().length === 0) {
      Alert.alert('Error', 'Por favor, escribe algo en la nota antes de enviarla.');
      return;
    }

    setIsSaving(true);
    try {
      let aiAnalysis = 'Análisis no disponible';

      try {
        const aiResponse = await axios.post('YOUR_AI_API_ENDPOINT/analyze-note', {
          noteContent: noteText,
          patientId: user.uid,
        });
        if (aiResponse.data && aiResponse.data.analysis) {
          aiAnalysis = aiResponse.data.analysis;
        } else {
          console.warn("La respuesta de la IA no contiene el campo 'analysis' esperado.");
        }
      } catch (aiError) {
        console.error("Error al comunicarse con la API de IA:", aiError);
        Alert.alert("Advertencia", "No se pudo obtener el análisis de la IA para esta nota.");
      }

      await addDoc(collection(firestore, 'users', user.uid, 'notes'), {
        content: noteText,
        analysis: aiAnalysis,
        createdAt: serverTimestamp(),
      });

      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        notesCount: increment(1)
      });

      Alert.alert('Éxito', 'Nota guardada y analizada correctamente.');
      setNoteText('');
      navigation.replace('Analytic');
    } catch (error) {
      console.error("Error al guardar la nota o actualizar el contador: ", error);
      Alert.alert('Error', 'No se pudo guardar la nota. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sección de Notas</Text>
      <TextInput
        style={styles.input}
        onChangeText={onChangeNoteText}
        value={noteText}
        placeholder='Escribe tu nota aquí...'
        multiline={true}
        numberOfLines={6}
        placeholderTextColor="#888"
      />
      <View style={styles.buttonWrapper}>
        <Button
          title={isSaving ? 'Enviando...' : 'Enviar Nota'}
          onPress={handleSendNote}
          disabled={isSaving}
          color="#28a745"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title='Ver Mis Notas'
          onPress={() => navigation.replace('Analytic')}
          color="#007bff"
        />
        <View style={styles.buttonaPocer} />
        <Button
          title='Volver al inicio'
          onPress={() => navigation.replace('Dashboards')}
          color="#28a745"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#2c3e50',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    minHeight: 150,
    borderColor: '#b0bec5',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 30,
    fontSize: 18,
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonWrapper: {
    width: '100%',
  },
  buttonSpacer: {
    height: 15,
  },
  buttonaPocer: {
    height: 10,
  }
});

export default Notes;