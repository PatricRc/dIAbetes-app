import { View, StyleSheet } from 'react-native';

export function Card({ children, variant = 'default', style }) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  default: {
    backgroundColor: '#FFFFFF',
    borderColor: '#e7e5e4',
  },
  alert: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  dark: {
    backgroundColor: '#292524',
    borderWidth: 0,
  },
});
