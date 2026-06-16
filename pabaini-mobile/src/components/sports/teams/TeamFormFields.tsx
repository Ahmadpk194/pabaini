import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CreateTeamPayload } from '../../../types/sports.types';

interface TeamFormFieldsProps {
  values: CreateTeamPayload;
  onChange: (field: keyof CreateTeamPayload, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function TeamFormFields({
  values,
  onChange,
  errors = {},
  disabled = false,
}: TeamFormFieldsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Team Name Input */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Team Name *</Text>
          <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
            {values.name ? values.name.length : 0}/100
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: errors.name ? '#FF3B30' : theme.colors.border,
              color: theme.colors.textPrimary,
              borderRadius: theme.radius.sm,
            },
            disabled && styles.disabledInput,
          ]}
          placeholder="e.g. Pabaini XI"
          placeholderTextColor={theme.colors.textSecondary}
          value={values.name}
          onChangeText={(val) => onChange('name', val)}
          maxLength={100}
          editable={!disabled}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Home Ground Input */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Home Ground (Optional)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: errors.home_ground ? '#FF3B30' : theme.colors.border,
              color: theme.colors.textPrimary,
              borderRadius: theme.radius.sm,
            },
            disabled && styles.disabledInput,
          ]}
          placeholder="e.g. Pabaini Cricket Ground"
          placeholderTextColor={theme.colors.textSecondary}
          value={values.home_ground || ''}
          onChangeText={(val) => onChange('home_ground', val)}
          maxLength={200}
          editable={!disabled}
        />
        {errors.home_ground && <Text style={styles.errorText}>{errors.home_ground}</Text>}
      </View>

      {/* Founded Year Input */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Founded Year (Optional)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: errors.founded_year ? '#FF3B30' : theme.colors.border,
              color: theme.colors.textPrimary,
              borderRadius: theme.radius.sm,
            },
            disabled && styles.disabledInput,
          ]}
          placeholder="e.g. 2024"
          placeholderTextColor={theme.colors.textSecondary}
          value={values.founded_year ? String(values.founded_year) : ''}
          onChangeText={(val) => {
            const numericVal = val.replace(/[^0-9]/g, '');
            onChange('founded_year', numericVal ? parseInt(numericVal, 10) : undefined);
          }}
          keyboardType="numeric"
          maxLength={4}
          editable={!disabled}
        />
        {errors.founded_year && <Text style={styles.errorText}>{errors.founded_year}</Text>}
      </View>

      {/* Description TextArea */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description (Optional)</Text>
          <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
            {values.description ? values.description.length : 0}/500
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.colors.surface,
              borderColor: errors.description ? '#FF3B30' : theme.colors.border,
              color: theme.colors.textPrimary,
              borderRadius: theme.radius.sm,
            },
            disabled && styles.disabledInput,
          ]}
          placeholder="Describe your team (moto, community, achievements)..."
          placeholderTextColor={theme.colors.textSecondary}
          value={values.description || ''}
          onChangeText={(val) => onChange('description', val)}
          multiline
          numberOfLines={4}
          maxLength={500}
          editable={!disabled}
          textAlignVertical="top"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  counter: {
    fontSize: 11,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  disabledInput: {
    opacity: 0.6,
  },
  textArea: {
    height: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
