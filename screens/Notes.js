import React, { useState } from 'react';
import firestore from '@react-native-firebase/firestore'; 
import { View, Text, Button, StyleSheet, TextInput , Alert} from 'react-native';

function Notes({ navigation }) {
  const [noteText, setNoteText] = useState('');

  const onChangeNoteText = (text) => {
    setNoteText(text);
  };

  const handleSendNote = async () => { 
    if (noteText.trim().length === 0) {
      Alert.alert('Error', 'Por favor, escribe algo en la nota antes de enviarla.');
      return; 
    }

    try {
      await firestore()
        .collection('usuarios') 
        .add({
          content: noteText, 
          createdAt: firestore.FieldValue.serverTimestamp(), 
        });

      Alert.alert('Éxito', 'Nota guardada en Firestore correctamente.');
      setNoteText(''); 
    } catch (error) {
      console.error("Error al guardar la nota en Firestore: ", error);
      Alert.alert('Error', 'No se pudo guardar la nota. Inténtalo de nuevo.');
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
          title='Enviar Nota'
          onPress={handleSendNote}
          color="#28a745"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title='Volver al login'
          onPress={() => navigation.navigate('login')}
          color="#007bff"
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
});

export default Notes;