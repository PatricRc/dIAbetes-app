import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export function Chip({ icon, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.chip}>
      {typeof icon === 'string' ? (
        <Text style={styles.emoji}>{icon}</Text>
      ) : (
        <View>{icon}</View>
      )}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#44403c',
  },
});
