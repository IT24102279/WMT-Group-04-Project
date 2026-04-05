import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const TimePickerField = ({ label, value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const parseTimeToDate = (timeString) => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours) || 0);
    date.setMinutes(parseInt(minutes) || 0);
    return date;
  };

  const formatTimeFromDate = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const currentTime = parseTimeToDate(value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={styles.valueText}>{value || 'Select time'}</Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={currentTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowPicker(false);
            if (event.type === 'set' && selectedTime) {
              onChange(formatTimeFromDate(selectedTime));
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

export default TimePickerField;
