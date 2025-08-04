import React from 'react';
import { Text, StyleSheet } from 'react-native';

export default function LufgaText({ style, weight = 'Regular', ...props }) {
  const fontFamily = `Lufga-${weight}`;
  return <Text style={[styles.text, { fontFamily }, style]} {...props} />;
}

const styles = StyleSheet.create({
  text: {
    // fonts base aqui
  },
});