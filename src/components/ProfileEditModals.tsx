/**
 * ProfileEditModals - модальные окна для редактирования профиля
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
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import Button from './Button';
import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import { calculateUserCalories, getGoalTypeLabel } from '../utils/calorieCalculator';

import type { User, GoalType } from '../types';

// Модалка редактирования имени
interface EditNameModalProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function EditNameModal({ visible, currentName, onClose, onSave }: EditNameModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('profile.editModals.pleaseEnterName'));
      return;
    }
    onSave(name.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('profile.editModals.editName')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
            ]}
            placeholder={t('profile.editModals.enterName')}
            placeholderTextColor={theme.disabled}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoFocus
          />

          <Button title={t('common.save')} onPress={handleSave} />
        </View>
      </View>
    </Modal>
  );
}

// Модалка редактирования целевого веса
interface EditTargetWeightModalProps {
  visible: boolean;
  currentWeight: number;
  targetWeight: number | undefined;
  goalType: GoalType | undefined;
  onClose: () => void;
  onSave: (targetWeight: number) => void;
}

export function EditTargetWeightModal({
  visible,
  currentWeight,
  targetWeight,
  goalType,
  onClose,
  onSave,
}: EditTargetWeightModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [weight, setWeight] = useState(targetWeight?.toString() || '');

  const handleSave = () => {
    const tw = parseFloat(weight);
    if (!tw || tw < 30 || tw > 300) {
      Alert.alert(t('common.error'), t('profile.editModals.invalidWeight'));
      return;
    }
    if (goalType === 'lose_weight' && tw >= currentWeight) {
      Alert.alert(t('common.error'), t('profile.editModals.targetWeightLowerForLoss'));
      return;
    }
    if (goalType === 'gain_weight' && tw <= currentWeight) {
      Alert.alert(t('common.error'), t('profile.editModals.targetWeightHigherForGain'));
      return;
    }
    onSave(tw);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('profile.editModals.editTargetWeight')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              {t('profile.editModals.currentWeight', { weight: currentWeight })}
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{currentWeight} kg</Text>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>
            {t('profile.editModals.editTargetWeight')} (kg)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
            ]}
            placeholder={t('profile.editModals.enterTargetWeight')}
            placeholderTextColor={theme.disabled}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            maxLength={5}
            autoFocus
          />

          <Button title={t('common.save')} onPress={handleSave} />
        </View>
      </View>
    </Modal>
  );
}

// Модалка редактирования дневной нормы калорий
interface EditCaloriesModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (calories: number) => void;
}

export function EditCaloriesModal({ visible, user, onClose, onSave }: EditCaloriesModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [calories, setCalories] = useState(user.dailyCalorieGoal.toString());

  const canRecalculate =
    user.weight && user.height && user.age && user.gender && user.activityLevel && user.goalType;

  const handleRecalculate = () => {
    if (!canRecalculate) {
      Alert.alert(t('common.error'), t('profile.editModals.basedOnProfile'));
      return;
    }

    const { targetCalories } = calculateUserCalories({
      weight: user.weight!,
      height: user.height!,
      age: user.age!,
      gender: user.gender!,
      activityLevel: user.activityLevel!,
      goalType: user.goalType!,
    });

    setCalories(targetCalories.toString());
    setShowRecalculate(false);
    Alert.alert(
      t('common.success'),
      t('profile.editModals.recommended', { calories: targetCalories })
    );
  };

  const handleSave = () => {
    const cal = parseInt(calories);
    if (!cal || cal < 1200 || cal > 5000) {
      Alert.alert(t('common.error'), t('profile.editModals.invalidCalories'));
      return;
    }
    onSave(cal);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('profile.editModals.editCalories')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>
            {t('profile.goalSettings.dailyCalories')}
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
            ]}
            placeholder={t('profile.editModals.enterCalories')}
            placeholderTextColor={theme.disabled}
            keyboardType="number-pad"
            value={calories}
            onChangeText={setCalories}
            maxLength={4}
            autoFocus
          />

          {canRecalculate && (
            <TouchableOpacity
              style={[styles.recalculateButton, { backgroundColor: theme.background }]}
              onPress={handleRecalculate}
            >
              <Ionicons name="calculator-outline" size={20} color={theme.primary} />
              <Text style={[styles.recalculateText, { color: theme.primary }]}>
                {t('profile.editModals.basedOnProfile')}
              </Text>
            </TouchableOpacity>
          )}

          <Button title={t('common.save')} onPress={handleSave} style={{ marginTop: Spacing.md }} />
        </View>
      </View>
    </Modal>
  );
}

// Модалка редактирования цели
interface EditGoalModalProps {
  visible: boolean;
  currentGoal: GoalType | undefined;
  onClose: () => void;
  onSave: (goal: GoalType) => void;
}

export function EditGoalModal({ visible, currentGoal, onClose, onSave }: EditGoalModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [goal, setGoal] = useState<GoalType | null>(currentGoal || null);

  const handleSave = () => {
    if (!goal) {
      Alert.alert(t('common.error'), t('profile.editModals.selectGoal'));
      return;
    }
    onSave(goal);
  };

  const goals: { type: GoalType; emoji: string }[] = [
    {
      type: 'lose_weight',
      emoji: '📉',
    },
    {
      type: 'maintain',
      emoji: '➡️',
    },
    {
      type: 'gain_weight',
      emoji: '📈',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('profile.editModals.selectGoal')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {goals.map(g => (
              <TouchableOpacity
                key={g.type}
                style={[
                  styles.goalOption,
                  { backgroundColor: theme.background, borderColor: theme.border },
                  goal === g.type && { borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => setGoal(g.type)}
              >
                <View style={styles.goalLeft}>
                  <Text style={styles.goalEmoji}>{g.emoji}</Text>
                  <View>
                    <Text style={[styles.goalTitle, { color: theme.text }]}>
                      {getGoalTypeLabel(g.type)}
                    </Text>
                  </View>
                </View>
                {goal === g.type && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button title={t('common.save')} onPress={handleSave} style={{ marginTop: Spacing.md }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  goalEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  goalLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  goalOption: {
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  goalTitle: {
    ...Typography.bodyLarge,
  },
  infoCard: {
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  infoLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    ...Typography.h3,
  },
  input: {
    ...Typography.bodyLarge,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  label: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.sm,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: '80%',
    padding: Spacing.lg,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTitle: {
    ...Typography.h2,
  },
  recalculateButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  recalculateText: {
    ...Typography.bodyLarge,
    marginLeft: Spacing.sm,
  },
});
