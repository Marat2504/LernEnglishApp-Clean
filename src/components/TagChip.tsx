import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TagChipProps {
  name: string;
  onPress?: () => void;
  onDelete?: (name: string) => void;
  selected?: boolean;
  isPredefined?: boolean;
}

export const TagChip: React.FC<TagChipProps> = ({ name, onPress, onDelete, selected, isPredefined }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, isPredefined && styles.predefinedChip, selected && styles.selectedChip]}
      onPress={onPress}
      onLongPress={onDelete && !isPredefined ? () => onDelete(name) : undefined}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#d4edda', // Светло-зеленый для пользовательских
    marginRight: 8,
    marginBottom: 8,
  },
  predefinedChip: {
    backgroundColor: '#cce7ff', // Светло-голубой для предустановленных
  },
  selectedChip: {
    backgroundColor: '#667eea',
  },

  text: {
    color: '#333',
  },
  selectedText: {
    color: 'white',
  },
});
