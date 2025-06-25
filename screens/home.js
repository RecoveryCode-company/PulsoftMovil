import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

function Home({ navigation }) {
  const [temperatura, setTemperatura] = useState(null);
  const [sudor, setSudor] = useState(null);
  const [cardiovascular, setCardiovascular] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const tempRef = database().ref('temperatura');
        const sudorRef = database().ref('sudor');
        const cardioRef = database().ref('cardiovascular');

        let loadedCount = 0;
        const totalListeners = 3;

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount === totalListeners) {
            setLoading(false);
          }
        };

        tempRef.on('value', snapshot => {
          if (snapshot.exists()) {
            setTemperatura(snapshot.val());
          } else {
            setTemperatura(null);
          }
          checkAllLoaded();
        }, errorObject => {
          console.error('Error al leer datos de temperatura: ', errorObject.code, errorObject.message);
          setError('Error al cargar datos de temperatura.');
          checkAllLoaded();
        });

        sudorRef.on('value', snapshot => {
          if (snapshot.exists()) {
            setSudor(snapshot.val());
          } else {
            setSudor(null);
          }
          checkAllLoaded();
        }, errorObject => {
          console.error('Error al leer datos de sudor: ', errorObject.code, errorObject.message);
          setError('Error al cargar datos de sudor.');
          checkAllLoaded();
        });

        cardioRef.on('value', snapshot => {
          if (snapshot.exists()) {
            setCardiovascular(snapshot.val());
          } else {
            setCardiovascular(null);
          }
          checkAllLoaded();
        }, errorObject => {
          console.error('Error al leer datos de cardiovascular: ', errorObject.code, errorObject.message);
          setError('Error al cargar datos de cardiovascular.');
          checkAllLoaded();
        });

        return () => {
          tempRef.off('value');
          sudorRef.off('value');
          cardioRef.off('value');
        };

      } catch (e) {
        console.error("Error general en fetchData:", e);
        setError("Ocurrió un error inesperado al cargar los datos.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Cargando datos de salud...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Reintentar" onPress={() => setLoading(true)} color="#dc3545" />
      </View>
    );
  }

  const renderSingleData = (title, value, unit = '') => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {value !== null ? (
        <Text style={styles.dataValueText}>{value} {unit}</Text>
      ) : (
        <Text style={styles.noDataText}>No hay datos de {title.toLowerCase()} disponibles.</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainHeader}>Mis Datos de Salud</Text>

      {renderSingleData('Temperatura', temperatura, '°C')}
      {renderSingleData('Sudor', sudor, '%')}
      {renderSingleData('Cardiovascular', cardiovascular, 'BPM')}

      <View style={styles.buttonWrapper}>
        <Button
          title='Crear nota'
          onPress={() => navigation.navigate('Notas')}
          color="#007bff"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#212529',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#343a40',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 5,
    width: '100%',
    textAlign: 'center',
  },
  dataValueText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 10,
  },
  buttonWrapper: {
    marginTop: 30,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default Home;