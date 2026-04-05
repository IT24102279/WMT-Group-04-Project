import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { toIsoDate } from '../utils/validation';

const DatePickerField = ({ label, value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = value ? new Date(value) : new Date();

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={styles.valueText}>{value || 'Select date'}</Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (event.type === 'set' && selectedDate) {
              onChange(toIsoDate(selectedDate));
            }
          }}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  label: { fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d2d2d2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#fff'
  },
  valueText: { color: '#222' }
});

export default DatePickerField;
