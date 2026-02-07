// ChatScreen - экран чата с AI диетологом

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ChatBubble from '../components/ChatBubble';
import Loading from '../components/Loading';
import { Typography, Spacing, BorderRadius } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import aiService from '../services/aiService';
import analyticsService from '../services/analyticsService';
import type { ChatMessage } from '../types';
import { APP_CONFIG } from '../config/constants';

interface ChatScreenProps {
  userId: string;
  onLimitReached: () => void;
}

export default function ChatScreen({ userId, onLimitReached }: ChatScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(aiService.getUsageStats(userId));
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Добавляем приветственное сообщение при первой загрузке
    if (messages.length === 0) {
      addAIMessage(t('onboarding.title') + ' 👋\n\n' + t('onboarding.subtitle') + '\n\n' + t('chat.placeholder'));
    }
  }, [t]);

  const addAIMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString() + '_ai',
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleSend = async () => {
    const text = inputText.trim();

    if (!text) {
      return;
    }

    if (text.length > APP_CONFIG.MAX_MESSAGE_LENGTH) {
      Alert.alert(t('common.error'), `${t('chat.placeholder')} (${APP_CONFIG.MAX_MESSAGE_LENGTH})`);
      return;
    }

    // Проверка лимита
    if (aiService.hasReachedLimit(userId)) {
      onLimitReached();
      return;
    }

    // Добавляем сообщение пользователя
    addUserMessage(text);
    setInputText('');

    // Отправляем запрос к AI
    setLoading(true);
    analyticsService.track('ai_message_sent', { message_length: text.length });

    try {
      const response = await aiService.sendMessage(userId, text, messages);

      // Добавляем ответ AI
      addAIMessage(response.message);

      // Обновляем статистику использования
      setUsage(aiService.getUsageStats(userId));

      analyticsService.track('ai_response_received', {
        tokens_used: response.usage.totalTokens,
      });

      // Проверяем лимит после ответа
      if (aiService.hasReachedLimit(userId)) {
        setTimeout(() => {
          onLimitReached();
        }, 500);
      }
    } catch (error: any) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        onLimitReached();
      } else {
        Alert.alert(t('common.error'), error.message || t('chat.noInternet'));
        analyticsService.track('ai_error_occurred', { error: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    // Автоскролл при добавлении сообщений
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  const isWarningLimit = usage.remaining <= 2 && usage.remaining > 0;
  const isLimitReached = usage.remaining === 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: theme.white,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      ...Typography.h3,
    },
    usageBadge: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: Spacing.sm + Spacing.xs,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.pill,
    },
    usageBadgeWarning: {
      backgroundColor: theme.warningLight,
    },
    usageBadgeError: {
      backgroundColor: theme.errorLight,
    },
    usageText: {
      ...Typography.caption,
      fontWeight: '600',
      color: theme.primary,
    },
    usageTextWarning: {
      color: theme.error,
    },
    messagesList: {
      paddingVertical: Spacing.md,
    },
    loadingContainer: {
      padding: Spacing.md,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primaryLight,
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.large,
    },
    typingText: {
      ...Typography.body,
      color: theme.textSecondary,
      marginRight: Spacing.sm,
    },
    dots: {
      flexDirection: 'row',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.primary,
      marginHorizontal: 2,
    },
    inputContainer: {
      padding: Spacing.md,
      backgroundColor: theme.white,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: theme.white,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 24,
      paddingLeft: Spacing.md,
      paddingRight: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    input: {
      flex: 1,
      fontSize: Typography.bodyLarge.fontSize,
      color: theme.text,
      maxHeight: 100,
      paddingVertical: Spacing.sm,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.primaryLight,
    },
    sendButtonDisabled: {
      backgroundColor: theme.background,
    },
    limitText: {
      ...Typography.caption,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    limitTextWarning: {
      color: theme.warning,
    },
    limitTextError: {
      ...Typography.caption,
      color: theme.error,
      textAlign: 'center',
      marginTop: Spacing.xs,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('chat.title')}</Text>
          <View style={[
            styles.usageBadge,
            isWarningLimit && styles.usageBadgeWarning,
            isLimitReached && styles.usageBadgeError
          ]}>
            <Text style={[
              styles.usageText,
              (isWarningLimit || isLimitReached) && styles.usageTextWarning
            ]}>
              {usage.remaining}/{usage.limit}
            </Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{t('chat.aiTyping')}</Text>
              <View style={styles.dots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={theme.disabled}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={APP_CONFIG.MAX_MESSAGE_LENGTH}
              editable={!loading && !isLimitReached}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading || isLimitReached) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading || isLimitReached}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !loading && !isLimitReached ? theme.primary : theme.disabled}
              />
            </TouchableOpacity>
          </View>

          {/* Limit indicator */}
          {!isLimitReached && (
            <Text style={[styles.limitText, isWarningLimit && styles.limitTextWarning]}>
              {t('chat.requestsUsed', { used: usage.remaining, limit: usage.limit })}
            </Text>
          )}
          {isLimitReached && (
            <TouchableOpacity onPress={onLimitReached}>
              <Text style={styles.limitTextError}>
                {t('chat.limitReached')} • {t('profile.subscription.upgradeButton')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
