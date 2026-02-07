// PhotoCaptureModal - модальное окно для захвата и анализа фото еды

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import Loading from './Loading';
import { Typography, BorderRadius, Spacing, Shadows } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import photoService from '../services/photoService';
import type { PhotoAnalysisResult } from '../types';

interface PhotoCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoSelected: (result: PhotoAnalysisResult) => void;
  userId: string;
}

type ModalState = 'idle' | 'preview' | 'analyzing' | 'error';

export default function PhotoCaptureModal({
  visible,
  onClose,
  onPhotoSelected,
  userId,
}: PhotoCaptureModalProps) {
  const { theme } = useTheme();
  const [state, setState] = useState<ModalState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.white,
      borderRadius: BorderRadius.large,
      width: '90%',
      maxHeight: '80%',
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
      color: theme.text,
    },
    content: {
      padding: Spacing.lg,
      alignItems: 'center',
    },
    // Idle state - выбор источника
    sourceContainer: {
      width: '100%',
      gap: Spacing.md,
    },
    sourceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.medium,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.white,
    },
    sourceIcon: {
      marginRight: Spacing.md,
    },
    sourceTextContainer: {
      flex: 1,
    },
    sourceTitle: {
      ...Typography.bodyLarge,
      fontWeight: '600',
      color: theme.text,
      marginBottom: Spacing.xs,
    },
    sourceDescription: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    // Preview state - показ фото
    photoPreview: {
      width: '100%',
      height: 300,
      borderRadius: BorderRadius.medium,
      backgroundColor: theme.border,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    photoImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
      width: '100%',
    },
    button: {
      flex: 1,
    },
    // Analyzing state
    analyzingContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
    },
    analyzingText: {
      ...Typography.bodyLarge,
      color: theme.text,
      marginTop: Spacing.lg,
      textAlign: 'center',
    },
    analyzingHint: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
    // Error state
    errorContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },
    errorIcon: {
      marginBottom: Spacing.md,
    },
    errorText: {
      ...Typography.body,
      color: theme.error,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
  });

  const handleClose = () => {
    if (state !== 'analyzing') {
      resetState();
      onClose();
    }
  };

  const resetState = () => {
    setState('idle');
    setPhotoUri(null);
    setError('');
  };

  const handleCameraPress = async () => {
    try {
      const uri = await photoService.capturePhoto();
      if (uri) {
        setPhotoUri(uri);
        setState('preview');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось сделать фото');
    }
  };

  const handleGalleryPress = async () => {
    try {
      const uri = await photoService.pickFromGallery();
      if (uri) {
        setPhotoUri(uri);
        setState('preview');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось выбрать фото');
    }
  };

  const handleRetake = () => {
    resetState();
  };

  const handleAnalyze = async () => {
    if (!photoUri) return;

    setState('analyzing');

    try {
      const result = await photoService.analyzeFood(photoUri, userId);

      // Успех - передаем результат наружу
      onPhotoSelected(result);
      resetState();
      onClose();
    } catch (error: any) {
      console.error('Photo analysis error:', error);
      setState('error');

      if (error.code === 'LOW_CONFIDENCE') {
        setError(
          'Не удалось распознать еду на фото.\n\nПопробуйте:\n• Сделать фото при лучшем освещении\n• Сфотографировать блюдо ближе\n• Использовать другое фото'
        );
      } else if (error.code === 'PHOTO_LIMIT_EXCEEDED') {
        setError(error.message);
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Нет подключения к интернету.\nПроверьте соединение и попробуйте снова.');
      } else {
        setError(error.message || 'Произошла ошибка при анализе фото');
      }
    }
  };

  const handleManualInput = () => {
    resetState();
    onClose();
  };

  const renderContent = () => {
    switch (state) {
      case 'idle':
        return (
          <View style={styles.sourceContainer}>
            <TouchableOpacity style={styles.sourceButton} onPress={handleCameraPress}>
              <Ionicons
                name="camera"
                size={32}
                color={theme.primary}
                style={styles.sourceIcon}
              />
              <View style={styles.sourceTextContainer}>
                <Text style={styles.sourceTitle}>📷 Камера</Text>
                <Text style={styles.sourceDescription}>
                  Сфотографировать еду прямо сейчас
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sourceButton} onPress={handleGalleryPress}>
              <Ionicons
                name="images"
                size={32}
                color={theme.primary}
                style={styles.sourceIcon}
              />
              <View style={styles.sourceTextContainer}>
                <Text style={styles.sourceTitle}>🖼 Галерея</Text>
                <Text style={styles.sourceDescription}>
                  Выбрать готовое фото из галереи
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        );

      case 'preview':
        return (
          <>
            <View style={styles.photoPreview}>
              {photoUri && <Image source={{ uri: photoUri }} style={styles.photoImage} />}
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Повторить"
                onPress={handleRetake}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Анализировать"
                onPress={handleAnalyze}
                style={styles.button}
              />
            </View>
          </>
        );

      case 'analyzing':
        return (
          <View style={styles.analyzingContainer}>
            <Loading text="" />
            <Text style={styles.analyzingText}>
              Анализируем фото с помощью AI...
            </Text>
            <Text style={styles.analyzingHint}>
              Обычно занимает 2-4 секунды
            </Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.errorContainer}>
            <Ionicons
              name="close-circle"
              size={64}
              color={theme.error}
              style={styles.errorIcon}
            />
            <Text style={styles.errorText}>{error}</Text>

            <View style={styles.buttonContainer}>
              <Button
                title="Повторить"
                onPress={handleRetake}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Ввести вручную"
                onPress={handleManualInput}
                style={styles.button}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Сфотографировать еду</Text>
            <TouchableOpacity onPress={handleClose} disabled={state === 'analyzing'}>
              <Ionicons
                name="close"
                size={28}
                color={state === 'analyzing' ? theme.border : theme.text}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>{renderContent()}</View>
        </View>
      </View>
    </Modal>
  );
}
