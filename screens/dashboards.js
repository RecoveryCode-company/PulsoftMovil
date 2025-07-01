import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig';

function Dashboards({ navigation }) {
    const [patientData, setPatientData] = useState({
        cardiovascular: 'Cargando...',
        sudor: 'Cargando...',
        temperatura: 'Cargando...',
    });

    useEffect(() => {
        const patientId = 'NBsn1Co2ABPHaStRMp8zKj3UYQ42';
        const patientRef = ref(database, `patients/${patientId}`);

        const unsubscribe = onValue(patientRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setPatientData({
                    cardiovascular: data.cardiovascular,
                    sudor: data.sudor,
                    temperatura: data.temperatura,
                });
            } else {
                setPatientData({
                    cardiovascular: 'N/A',
                    sudor: 'N/A',
                    temperatura: 'N/A',
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Monitoreo de Paciente</Text>
            <Text style={styles.dataText}>Cardiovascular: {patientData.cardiovascular}</Text>
            <Text style={styles.dataText}>Sudor: {patientData.sudor}</Text>
            <Text style={styles.dataText}>Temperatura: {patientData.temperatura}</Text>
            <View style={styles.buttonSpacer} />
            <Button
                title="Escribir nota"
                onPress={() => navigation.navigate('Notes')}
                color="#007bff"
            />
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
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
        color: '#000',
    },
    dataText: {
        fontSize: 16,
        marginBottom: 12,
        color: '#000',
    },
    buttonSpacer: {
        height: 20,
    },
});

export default Dashboards;
