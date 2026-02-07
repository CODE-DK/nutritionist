// AddMealModal - модальное окно для добавления/редактирования приема пищи

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Input from './Input';
import Button from './Button';
import PhotoCaptureModal from './PhotoCaptureModal';
import { Typography, BorderRadius, Spacing, Shadows } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import photoService from '../services/photoService';
import type { MealType, FoodEntry, PhotoAnalysisResult, PhotoUsage } from '../types';

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: Omit<FoodEntry, 'id' | 'timestamp'>) => Promise<void>;
  editingMeal?: FoodEntry | null;
  userId: string;
  date: string;
}

export default function AddMealModal({
  visible,
  onClose,
  onSave,
  editingMeal,
  userId,
  date,
}: AddMealModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const MEAL_TYPES: Array<{ type: MealType; emoji: string; label: string }> = [
    { type: 'breakfast', emoji: '🍳', label: t('diary.mealTypes.breakfast') },
    { type: 'lunch', emoji: '🍔', label: t('diary.mealTypes.lunch') },
    { type: 'dinner', emoji: '🍽', label: t('diary.mealTypes.dinner') },
    { type: 'snack', emoji: '🍎', label: t('diary.mealTypes.snack') },
  ];
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Photo recognition states
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoResult, setPhotoResult] = useState<PhotoAnalysisResult | null>(null);
  const [photoUsage, setPhotoUsage] = useState<PhotoUsage>({ current: 0, limit: 5, remaining: 5 });

  const isEditing = !!editingMeal;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.white,
      borderTopLeftRadius: BorderRadius.large,
      borderTopRightRadius: BorderRadius.large,
      maxHeight: '90%',
      ...Shadows.level3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      ...Typography.h3,
    },
    content: {
      padding: Spacing.lg,
    },
    sectionLabel: {
      ...Typography.body,
      fontWeight: '600',
      color: theme.text,
      marginBottom: Spacing.sm,
      marginTop: Spacing.sm,
    },
    mealTypeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    mealTypeButton: {
      flex: 1,
      alignItems: 'center',
      padding: Spacing.md,
      marginHorizontal: Spacing.xs,
      borderRadius: BorderRadius.medium,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.white,
    },
    mealTypeButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    mealTypeEmoji: {
      fontSize: 32,
      marginBottom: Spacing.xs,
    },
    mealTypeLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    mealTypeLabelActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    macrosRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    macroInput: {
      flex: 1,
      marginHorizontal: Spacing.xs,
    },
    buttonContainer: {
      marginTop: Spacing.lg,
      gap: Spacing.md,
    },
    saveButton: {
      marginBottom: Spacing.sm,
    },
    // Photo button styles
    photoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.medium,
      borderWidth: 2,
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    photoButtonDisabled: {
      borderColor: theme.border,
      backgroundColor: theme.border,
      opacity: 0.6,
    },
    photoButtonTextContainer: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    photoButtonText: {
      ...Typography.bodyLarge,
      fontWeight: '600',
      color: theme.text,
      marginBottom: Spacing.xs,
    },
    photoCounter: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    // Limit banner styles
    limitBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.medium,
      backgroundColor: theme.warningLight || '#FFF3CD',
    },
    limitBannerTextContainer: {
      marginLeft: Spacing.md,
    },
    limitBannerText: {
      ...Typography.body,
      fontWeight: '600',
      color: theme.warning,
    },
    limitBannerSubtext: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    // AI indicator styles
    aiIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.sm,
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.small,
      backgroundColor: theme.primaryLight,
    },
    aiIndicatorText: {
      ...Typography.caption,
      color: theme.primary,
      marginLeft: Spacing.xs,
      fontWeight: '600',
    },
    // Photo preview styles
    photoPreviewContainer: {
      marginBottom: Spacing.md,
    },
    photoPreview: {
      width: '100%',
      height: 200,
      borderRadius: BorderRadius.medium,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.border,
    },
    photoImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    photoRemoveButton: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 14,
    },
  });

  // Загрузить photo usage при открытии модала
  useEffect(() => {
    if (visible && userId && !isEditing) {
      loadPhotoUsage();
    }
  }, [visible, userId]);

  // Загрузить данные при редактировании
  useEffect(() => {
    if (editingMeal) {
      setMealType(editingMeal.mealType);
      setName(editingMeal.name);
      setCalories(editingMeal.calories.toString());
      setProtein(editingMeal.protein?.toString() || '');
      setCarbs(editingMeal.carbs?.toString() || '');
      setFat(editingMeal.fat?.toString() || '');

      // Load photo data if exists
      if (editingMeal.photoUrl) {
        setPhotoResult({
          dishName: editingMeal.name,
          calories: editingMeal.calories,
          protein: editingMeal.protein || 0,
          carbs: editingMeal.carbs || 0,
          fat: editingMeal.fat || 0,
          confidence: editingMeal.aiConfidence || 0,
          reasoning: editingMeal.aiReasoning || '',
          photoUri: editingMeal.photoUrl,
          photoUrl: editingMeal.photoUrl,
        });
      }
    } else {
      resetForm();
    }
  }, [editingMeal, visible]);

  const loadPhotoUsage = async () => {
    try {
      const usage = await photoService.getPhotoUsage(userId);
      setPhotoUsage(usage);
    } catch (error) {
      console.error('Failed to load photo usage:', error);
      // Not critical, continue with default
    }
  };

  const resetForm = () => {
    setMealType('breakfast');
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setErrors({});
    setPhotoResult(null);
  };

  const handlePhotoAnalyzed = (result: PhotoAnalysisResult) => {
    setPhotoResult(result);

    // Auto-fill формы с AI результатами
    setName(result.dishName);
    setCalories(result.calories.toString());
    setProtein(result.protein.toString());
    setCarbs(result.carbs.toString());
    setFat(result.fat.toString());

    // Reload usage после анализа
    loadPhotoUsage();

    // Показать индикатор AI
    if (result.confidence >= 0.7) {
      Alert.alert(
        t('common.success'),
        `${Math.round(result.confidence * 100)}%`
      );
    } else {
      Alert.alert(
        t('common.error'),
        `${Math.round(result.confidence * 100)}%`
      );
    }

    setPhotoModalVisible(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t('diary.addMealModal.enterMealName');
    } else if (name.trim().length > 100) {
      newErrors.name = t('diary.addMealModal.invalidValues');
    }

    const caloriesNum = parseFloat(calories);
    if (!calories || isNaN(caloriesNum)) {
      newErrors.calories = t('diary.addMealModal.caloriesLabel');
    } else if (caloriesNum < 0 || caloriesNum > 5000) {
      newErrors.calories = t('diary.addMealModal.invalidValues');
    }

    if (protein) {
      const proteinNum = parseFloat(protein);
      if (isNaN(proteinNum) || proteinNum < 0 || proteinNum > 500) {
        newErrors.protein = t('diary.addMealModal.invalidValues');
      }
    }

    if (carbs) {
      const carbsNum = parseFloat(carbs);
      if (isNaN(carbsNum) || carbsNum < 0 || carbsNum > 500) {
        newErrors.carbs = t('diary.addMealModal.invalidValues');
      }
    }

    if (fat) {
      const fatNum = parseFloat(fat);
      if (isNaN(fatNum) || fatNum < 0 || fatNum > 500) {
        newErrors.fat = t('diary.addMealModal.invalidValues');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const meal: Omit<FoodEntry, 'id' | 'timestamp'> = {
        userId,
        date,
        mealType,
        name: name.trim(),
        calories: parseFloat(calories),
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        photoUrl: photoResult?.photoUrl,
        aiConfidence: photoResult?.confidence,
        aiReasoning: photoResult?.reasoning,
      };

      await onSave(meal);
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEditing ? t('common.edit') : t('diary.addMealModal.title')}
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo Button */}
            {!isEditing && (
              <>
                <TouchableOpacity
                  style={[
                    styles.photoButton,
                    photoUsage.remaining === 0 && styles.photoButtonDisabled,
                  ]}
                  onPress={() => setPhotoModalVisible(true)}
                  disabled={loading || photoUsage.remaining === 0}
                >
                  <Ionicons
                    name="camera"
                    size={24}
                    color={photoUsage.remaining === 0 ? theme.textSecondary : theme.primary}
                  />
                  <View style={styles.photoButtonTextContainer}>
                    <Text style={styles.photoButtonText}>{t('diary.addMealModal.photoButton')}</Text>
                    <Text style={styles.photoCounter}>
                      {photoUsage.remaining}/{photoUsage.limit}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                {photoUsage.remaining === 0 && (
                  <View style={styles.limitBanner}>
                    <Ionicons name="lock-closed" size={20} color={theme.warning} />
                    <View style={styles.limitBannerTextContainer}>
                      <Text style={styles.limitBannerText}>
                        {t('chat.limitReached')}
                      </Text>
                      <Text style={styles.limitBannerSubtext}>
                        {t('profile.subscription.upgradeButton')} 🚀
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Meal Type Selector */}
            <Text style={styles.sectionLabel}>{t('diary.addMealModal.mealType')}</Text>
            <View style={styles.mealTypeContainer}>
              {MEAL_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.mealTypeButton,
                    mealType === item.type && styles.mealTypeButtonActive,
                  ]}
                  onPress={() => setMealType(item.type)}
                  disabled={loading}
                >
                  <Text style={styles.mealTypeEmoji}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.mealTypeLabel,
                      mealType === item.type && styles.mealTypeLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name Input */}
            <Input
              label={t('diary.addMealModal.mealName')}
              placeholder={t('diary.addMealModal.enterMealName')}
              value={name}
              onChangeText={setName}
              error={errors.name}
              editable={!loading}
              maxLength={100}
            />

            {/* Calories Input */}
            <Input
              label={t('diary.addMealModal.caloriesLabel')}
              placeholder="350"
              value={calories}
              onChangeText={setCalories}
              error={errors.calories}
              keyboardType="numeric"
              editable={!loading}
            />

            {/* Macros Row */}
            <Text style={styles.sectionLabel}>{t('diary.protein')} / {t('diary.fat')} / {t('diary.carbs')}</Text>
            <View style={styles.macrosRow}>
              <View style={styles.macroInput}>
                <Input
                  label={t('diary.addMealModal.proteinLabel')}
                  placeholder="12"
                  value={protein}
                  onChangeText={setProtein}
                  error={errors.protein}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              <View style={styles.macroInput}>
                <Input
                  label={t('diary.addMealModal.fatLabel')}
                  placeholder="8"
                  value={fat}
                  onChangeText={setFat}
                  error={errors.fat}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              <View style={styles.macroInput}>
                <Input
                  label={t('diary.addMealModal.carbsLabel')}
                  placeholder="58"
                  value={carbs}
                  onChangeText={setCarbs}
                  error={errors.carbs}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>

            {/* AI Indicator */}
            {photoResult && (
              <View style={styles.aiIndicator}>
                <Ionicons name="sparkles" size={16} color={theme.primary} />
                <Text style={styles.aiIndicatorText}>
                  {t('chat.aiTyping')} ({Math.round(photoResult.confidence * 100)}%)
                </Text>
              </View>
            )}

            {/* Photo Preview */}
            {photoResult?.photoUri && (
              <View style={styles.photoPreviewContainer}>
                <Text style={styles.sectionLabel}>{t('diary.addMealModal.photoButton')}</Text>
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: photoResult.photoUri }}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity
                    style={styles.photoRemoveButton}
                    onPress={() => setPhotoResult(null)}
                  >
                    <Ionicons name="close-circle" size={28} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title={isEditing ? t('common.save') : t('common.add')}
                onPress={handleSave}
                loading={loading}
                style={styles.saveButton}
              />
              <Button
                title={t('common.cancel')}
                onPress={handleClose}
                variant="secondary"
                disabled={loading}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Photo Capture Modal */}
      <PhotoCaptureModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onPhotoSelected={handlePhotoAnalyzed}
        userId={userId}
      />
    </Modal>
  );
}
