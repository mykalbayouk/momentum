import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

interface DropdownProps {
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Dropdown({ options, value, onSelect, style, textStyle }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.buttonText, textStyle]}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item === value && styles.selectedOption,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
  },
  buttonText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  arrow: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '50%',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey200,
  },
  selectedOption: {
    backgroundColor: colors.primary.light,
  },
  optionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectedOptionText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
}); 