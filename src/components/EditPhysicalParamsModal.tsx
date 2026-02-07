/**
 * EditPhysicalParamsModal - модальное окно для редактирования физических параметров
 * (рост, вес, возраст, пол)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import type { User, Gender } from '../types';

interface EditPhysicalParamsModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updates: {
    height: number;
    weight: number;
    age: number;
    gender: Gender;
    recalculateCalories: boolean;
  }) => void;
}

export default function EditPhysicalParamsModal({
  visible,
  user,
  onClose,
  onSave,
}: EditPhysicalParamsModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // State для всех полей
  const [height, setHeight] = useState(user.height?.toString() || '');
  const [weight, setWeight] = useState(user.weight?.toString() || '');
  const [age, setAge] = useState(user.age?.toString() || '');
  const [gender, setGender] = useState<Gender>(user.gender || 'male');
  const [recalculateCalories, setRecalculateCalories] = useState(true);

  // Проверка возможности пересчета калорий
  const canRecalculate = user.activityLevel && user.goalType;

  const handleSave = () => {
    // Валидация роста
    const h = parseInt(height);
    if (!h || h < 100 || h > 250) {
      Alert.alert(t('common.error'), 'Рост должен быть от 100 до 250 см');
      return;
    }

    // Валидация веса
    const w = parseFloat(weight);
    if (!w || w < 30 || w > 300) {
      Alert.alert(t('common.error'), 'Вес должен быть от 30 до 300 кг');
      return;
    }

    // Валидация возраста
    const a = parseInt(age);
    if (!a || a < 13 || a > 120) {
      Alert.alert(t('common.error'), 'Возраст должен быть от 13 до 120 лет');
      return;
    }

    // Сохранение
    onSave({
      height: h,
      weight: w,
      age: a,
      gender,
      recalculateCalories: recalculateCalories && canRecalculate,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Физические параметры
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Рост */}
            <Text style={[styles.label, { color: theme.text }]}>Рост (см)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="175"
              placeholderTextColor={theme.disabled}
              keyboardType="number-pad"
              value={height}
              onChangeText={setHeight}
              maxLength={3}
            />

            {/* Вес */}
            <Text style={[styles.label, { color: theme.text }]}>Текущий вес (кг)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="70.5"
              placeholderTextColor={theme.disabled}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              maxLength={5}
            />

            {/* Возраст */}
            <Text style={[styles.label, { color: theme.text }]}>Возраст (лет)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="30"
              placeholderTextColor={theme.disabled}
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              maxLength={3}
            />

            {/* Пол */}
            <Text style={[styles.label, { color: theme.text }]}>Пол</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  { backgroundColor: theme.background, borderColor: theme.border },
                  gender === 'male' && { borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => setGender('male')}
              >
                <View style={styles.genderLeft}>
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text style={[styles.genderText, { color: theme.text }]}>Мужской</Text>
                </View>
                {gender === 'male' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  { backgroundColor: theme.background, borderColor: theme.border },
                  gender === 'female' && { borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => setGender('female')}
              >
                <View style={styles.genderLeft}>
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text style={[styles.genderText, { color: theme.text }]}>Женский</Text>
                </View>
                {gender === 'female' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
              </TouchableOpacity>
            </View>

            {/* Чекбокс пересчета калорий */}
            {canRecalculate && (
              <View style={[styles.recalculateContainer, { backgroundColor: theme.background }]}>
                <View style={styles.recalculateLeft}>
                  <Ionicons name="calculator-outline" size={20} color={theme.primary} />
                  <View style={styles.recalculateTextContainer}>
                    <Text style={[styles.recalculateTitle, { color: theme.text }]}>
                      Пересчитать калории автоматически
                    </Text>
                    <Text style={[styles.recalculateSubtitle, { color: theme.textSecondary }]}>
                      На основе новых параметров
                    </Text>
                  </View>
                </View>
                <Switch
                  value={recalculateCalories}
                  onValueChange={(value: boolean) => setRecalculateCalories(value)}
                  trackColor={{ false: theme.disabled, true: theme.primaryLight }}
                  thumbColor={recalculateCalories ? theme.primary : theme.textSecondary}
                />
              </View>
            )}

            {/* Кнопка сохранения */}
            <Button title={t('common.save')} onPress={handleSave} style={{ marginTop: Spacing.md }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
  },
  label: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    ...Typography.bodyLarge,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  genderContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
  },
  genderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  genderText: {
    ...Typography.bodyLarge,
  },
  recalculateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.md,
  },
  recalculateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recalculateTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  recalculateTitle: {
    ...Typography.bodyLarge,
  },
  recalculateSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
});
