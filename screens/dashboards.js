import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from './colors';

const { width } = Dimensions.get('window');

function Dashboards({ navigation }) {
  // Aquí iría tu lógica y datos reales
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.graphsRow}>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Gráfica 1</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>[Chart.js aquí]</Text>
          </View>
        </View>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Gráfica 2</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>[Chart.js aquí]</Text>
          </View>
        </View>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Gráfica 3</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>[Chart.js aquí]</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Notes')}
        >
          <Text style={styles.actionButtonText}>Ir a Notas</Text>
        </TouchableOpacity>
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
    fontSize: 13,
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
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
});

export default Dashboards;