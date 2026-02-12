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

import Button from './Button';
import Input from './Input';
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
    content: {
      padding: Spacing.lg,
    },
    header: {
      alignItems: 'center',
      borderBottomColor: theme.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    headerTitle: {
      ...Typography.h3,
    },
    macrosRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    mealTypeButton: {
      alignItems: 'center',
      backgroundColor: theme.white,
      borderColor: theme.border,
      borderRadius: BorderRadius.medium,
      borderWidth: 2,
      flex: 1,
      marginHorizontal: Spacing.xs,
      padding: Spacing.md,
    },
    mealTypeButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    mealTypeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
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
    macroInput: {
      flex: 1,
      marginHorizontal: Spacing.xs,
    },
    modalContainer: {
      backgroundColor: theme.white,
      borderTopLeftRadius: BorderRadius.large,
      borderTopRightRadius: BorderRadius.large,
      maxHeight: '90%',
      ...(Platform.OS === 'web' && {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      }),
      ...Shadows.level3,
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flex: 1,
      justifyContent: 'flex-end',
    },
    sectionLabel: {
      ...Typography.body,
      color: theme.text,
      fontWeight: '600',
      marginBottom: Spacing.sm,
      marginTop: Spacing.sm,
    },
    buttonContainer: {
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    saveButton: {
      marginBottom: Spacing.sm,
    },
    // Photo button styles
    photoButton: {
      alignItems: 'center',
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
      borderRadius: BorderRadius.medium,
      borderWidth: 2,
      flexDirection: 'row',
      marginBottom: Spacing.lg,
      padding: Spacing.md,
    },
    photoButtonDisabled: {
      backgroundColor: theme.border,
      borderColor: theme.border,
      opacity: 0.6,
    },
    photoButtonTextContainer: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    photoButtonText: {
      ...Typography.bodyLarge,
      color: theme.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    photoCounter: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    // Limit banner styles
    limitBanner: {
      alignItems: 'center',
      backgroundColor: theme.warningLight || '#FFF3CD',
      borderRadius: BorderRadius.medium,
      flexDirection: 'row',
      marginBottom: Spacing.lg,
      padding: Spacing.md,
    },
    limitBannerTextContainer: {
      marginLeft: Spacing.md,
    },
    limitBannerText: {
      ...Typography.body,
      color: theme.warning,
      fontWeight: '600',
    },
    limitBannerSubtext: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    // AI indicator styles
    aiIndicator: {
      alignItems: 'center',
      backgroundColor: theme.primaryLight,
      borderRadius: BorderRadius.small,
      flexDirection: 'row',
      marginBottom: Spacing.md,
      padding: Spacing.sm,
    },
    aiIndicatorText: {
      ...Typography.caption,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: Spacing.xs,
    },
    // Photo preview styles
    photoPreviewContainer: {
      marginBottom: Spacing.md,
    },
    photoPreview: {
      backgroundColor: theme.border,
      borderRadius: BorderRadius.medium,
      height: 200,
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    photoImage: {
      height: '100%',
      resizeMode: 'cover',
      width: '100%',
    },
    photoRemoveButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 14,
      position: 'absolute',
      right: Spacing.sm,
      top: Spacing.sm,
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
      Alert.alert(t('common.success'), `${Math.round(result.confidence * 100)}%`);
    } else {
      Alert.alert(t('common.error'), `${Math.round(result.confidence * 100)}%`);
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
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
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
                    <Text style={styles.photoButtonText}>
                      {t('diary.addMealModal.photoButton')}
                    </Text>
                    <Text style={styles.photoCounter}>
                      {photoUsage.remaining}/{photoUsage.limit}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {photoUsage.remaining === 0 && (
                  <View style={styles.limitBanner}>
                    <Ionicons name="lock-closed" size={20} color={theme.warning} />
                    <View style={styles.limitBannerTextContainer}>
                      <Text style={styles.limitBannerText}>{t('chat.limitReached')}</Text>
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
              {MEAL_TYPES.map(item => (
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
            <Text style={styles.sectionLabel}>
              {t('diary.protein')} / {t('diary.fat')} / {t('diary.carbs')}
            </Text>
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
                  <Image source={{ uri: photoResult.photoUri }} style={styles.photoImage} />
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
