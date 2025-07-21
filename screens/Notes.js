import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';

function Notes({ navigation }) {
  const [noteText, setNoteText] = useState('');
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado. Por favor, inicia sesión.');
      navigation.navigate('Login');
      return;
    }
    setUser(currentUser);
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
      // Solo guarda la nota; la función en Firebase se encargará del análisis
      await addDoc(collection(firestore, 'users', user.uid, 'notes'), {
        content: noteText,
        createdAt: serverTimestamp(),
      });

      // Actualiza el contador de notas
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        notesCount: increment(1)
      });

      Alert.alert('Éxito', 'Nota guardada. El análisis será generado automáticamente.');
      setNoteText('');
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
        multiline
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
        <View style={styles.buttonSpacer} />
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
  }
});

export default Notes;
