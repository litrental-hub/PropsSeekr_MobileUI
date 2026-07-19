import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface DropdownProps {
  label?: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  themeColor?: string;
}

export function Dropdown({ label, options, selected, onSelect, placeholder = 'Select an option', themeColor = '#10B981' }: DropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={styles.selector} 
        activeOpacity={0.8} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectedText, !selected && { color: '#94A3B8' }]}>
          {selected || placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownMenu}>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.optionItem, item === selected && { backgroundColor: `${themeColor}15` }]}
                      onPress={() => {
                        onSelect(item);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={[styles.optionText, item === selected && { color: themeColor, fontWeight: '700' }]}>
                        {item}
                      </Text>
                      {item === selected && (
                        <MaterialCommunityIcons name="check" size={18} color={themeColor} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dropdownMenu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    maxHeight: '60%',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 15,
    color: '#334155',
  },
});
