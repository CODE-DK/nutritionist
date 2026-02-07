// PaywallScreen - экран покупки Premium

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import { Typography, Spacing, BorderRadius, Shadows } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import analyticsService from '../services/analyticsService';

interface PaywallScreenProps {
  onClose: () => void;
}

export default function PaywallScreen({ onClose }: PaywallScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const PREMIUM_FEATURES = [
    t('paywall.unlimitedAI'),
    t('paywall.weeklyPlans'),
    t('paywall.advancedAnalytics'),
    t('paywall.recipeDatabase'),
    t('paywall.prioritySupport'),
  ];

  const PLANS = [
    {
      id: 'yearly',
      title: t('paywall.yearlyPlan'),
      price: t('paywall.yearlyPrice'),
      savings: t('paywall.savings'),
      recommended: true,
    },
    {
      id: 'monthly',
      title: t('paywall.monthlyPlan'),
      price: t('paywall.monthlyPrice'),
      savings: null,
      recommended: false,
    },
  ];

  const handlePurchase = () => {
    analyticsService.track('paywall_viewed');

    Alert.alert(
      t('paywall.comingSoon'),
      t('paywall.comingSoonMessage'),
      [{ text: t('common.ok') }]
    );
  };

  const handleClose = () => {
    analyticsService.track('paywall_dismissed');
    onClose();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.white,
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: Spacing.md,
      zIndex: 10,
      padding: Spacing.sm,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    hero: {
      alignItems: 'center',
      marginTop: Spacing.xxl,
      marginBottom: Spacing.xl,
    },
    heroGradient: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
      ...Shadows.level3,
    },
    heroEmoji: {
      fontSize: 50,
    },
    title: {
      ...Typography.h1,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Typography.bodyLarge,
      color: theme.textSecondary,
    },
    features: {
      marginBottom: Spacing.xl,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    featureText: {
      ...Typography.bodyLarge,
      marginLeft: Spacing.md,
    },
    plans: {
      marginBottom: Spacing.lg,
    },
    planCard: {
      backgroundColor: theme.background,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: BorderRadius.large,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    planCardSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    planTitle: {
      ...Typography.h3,
      flex: 1,
    },
    planTitleSelected: {
      color: theme.primary,
    },
    recommendedBadge: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.pill,
    },
    recommendedText: {
      ...Typography.caption,
      color: theme.white,
      fontWeight: '600',
    },
    planPrice: {
      ...Typography.h2,
      marginBottom: Spacing.xs,
    },
    planPriceSelected: {
      color: theme.primary,
    },
    planSavings: {
      ...Typography.body,
      color: theme.success,
    },
    radioContainer: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioOuterSelected: {
      borderColor: theme.primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.primary,
    },
    purchaseButton: {
      marginBottom: Spacing.md,
    },
    finePrint: {
      ...Typography.caption,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={28} color={theme.text} />
      </TouchableOpacity>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[theme.gradientPremiumStart, theme.gradientPremiumEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Text style={styles.heroEmoji}>⭐</Text>
          </LinearGradient>

          <Text style={styles.title}>{t('paywall.title')}</Text>
          <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles.planHeader}>
                <Text style={[
                  styles.planTitle,
                  selectedPlan === plan.id && styles.planTitleSelected,
                ]}>
                  {plan.title}
                </Text>
                {plan.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>{t('paywall.best')}</Text>
                  </View>
                )}
              </View>

              <Text style={[
                styles.planPrice,
                selectedPlan === plan.id && styles.planPriceSelected,
              ]}>
                {plan.price}
              </Text>

              {plan.savings && (
                <Text style={styles.planSavings}>{plan.savings}</Text>
              )}

              {/* Radio button */}
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioOuter,
                  selectedPlan === plan.id && styles.radioOuterSelected,
                ]}>
                  {selectedPlan === plan.id && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Purchase Button */}
        <Button
          title={t('paywall.purchaseButton')}
          onPress={handlePurchase}
          style={styles.purchaseButton}
        />

        {/* Fine Print */}
        <Text style={styles.finePrint}>
          {t('paywall.cancelAnytime')}
        </Text>

        {/* Restore Purchases */}
        <Button
          title={t('paywall.restorePurchases')}
          variant="text"
          onPress={() => Alert.alert(t('paywall.restorePurchases'), t('paywall.restoreMessage'))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
