/**
 * MetabolismInfoModal - образовательная модалка с информацией о метаболизме
 * Объясняет термины: BMR, TDEE, целевая норма калорий, дефицит
 */

import React from 'react';

import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

interface MetabolismInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MetabolismInfoModal({ visible, onClose }: MetabolismInfoModalProps) {
  const { theme } = useTheme();

  const sections = [
    {
      emoji: '🔥',
      title: 'BMR (Базовый метаболизм)',
      subtitle: 'Basal Metabolic Rate',
      description:
        'Количество калорий, которое ваш организм сжигает в состоянии полного покоя для поддержания жизненно важных функций.',
      points: [
        'Дыхание и кровообращение',
        'Поддержание температуры тела',
        'Обновление клеток',
        'Работа внутренних органов',
      ],
    },
    {
      emoji: '⚡',
      title: 'TDEE (Общий расход энергии)',
      subtitle: 'Total Daily Energy Expenditure',
      description:
        'Общее количество калорий, которое вы сжигаете за день с учетом всей вашей активности.',
      points: [
        'BMR × коэффициент активности',
        'Включает тренировки',
        'Включает повседневное движение',
        'Включает пищеварение',
      ],
    },
    {
      emoji: '🎯',
      title: 'Целевая норма калорий',
      subtitle: 'Ваша персональная норма',
      description: 'Количество калорий, которое нужно потреблять для достижения вашей цели.',
      points: [
        'Похудение: TDEE - 20% (дефицит)',
        'Поддержание веса: TDEE',
        'Набор массы: TDEE + 10% (профицит)',
        'Корректируется под вашу цель',
      ],
    },
    {
      emoji: '📊',
      title: 'Дефицит калорий',
      subtitle: 'Как это работает',
      description: 'Разница между вашим расходом энергии и потреблением калорий.',
      points: [
        '7700 ккал дефицита = 1 кг потери веса',
        'Безопасная потеря: 0.5-1 кг в неделю',
        'Безопасный набор: 0.25-0.5 кг в неделю',
        'Слишком большой дефицит вреден!',
      ],
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Как работает метаболизм</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {sections.map((section, index) => (
              <View key={index} style={[styles.section, { backgroundColor: theme.background }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.emoji}>{section.emoji}</Text>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {section.title}
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                      {section.subtitle}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.description, { color: theme.text }]}>
                  {section.description}
                </Text>

                <View style={styles.pointsContainer}>
                  {section.points.map((point, pointIndex) => (
                    <View key={pointIndex} style={styles.pointRow}>
                      <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                      <Text style={[styles.pointText, { color: theme.textSecondary }]}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Дополнительная информация */}
            <View style={[styles.infoBox, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="information-circle" size={24} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Все расчеты основаны на формуле Mifflin-St Jeor - одной из самых точных формул для
                определения базового метаболизма.
              </Text>
            </View>

            <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Text style={[styles.warningText, { color: theme.text }]}>
                При наличии медицинских показаний обязательно проконсультируйтесь с врачом перед
                изменением питания.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bullet: {
    borderRadius: 3,
    height: 6,
    marginRight: Spacing.sm,
    marginTop: 7,
    width: 6,
  },
  description: {
    ...Typography.body,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  emoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  infoBox: {
    alignItems: 'flex-start',
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  infoText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 20,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: '90%',
    padding: Spacing.lg,
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
  pointRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  pointText: {
    ...Typography.body,
    flex: 1,
  },
  pointsContainer: {
    gap: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  warningBox: {
    alignItems: 'flex-start',
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  warningText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 20,
  },
});
