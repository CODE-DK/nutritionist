// ChatBubble Component - сообщение в чате согласно DESIGN.md

import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

import { Typography, BorderRadius, Spacing, Shadows } from '../config/theme';
import { useTheme } from '../config/ThemeContext';

import type { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';

  const styles = StyleSheet.create({
    aiBubble: {
      backgroundColor: theme.primaryLight,
      borderBottomLeftRadius: 4,
      borderRadius: BorderRadius.large,
    },
    aiText: {
      color: theme.text,
    },
    avatarPlaceholder: {
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      marginHorizontal: Spacing.sm,
      width: 32,
    },
    avatarText: {
      fontSize: 18,
    },
    bubble: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + Spacing.xs,
      ...Shadows.level1,
    },
    bubbleWrapper: {
      maxWidth: '75%',
    },
    container: {
      flexDirection: 'row',
      marginVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    text: {
      fontSize: Typography.bodyLarge.fontSize,
      lineHeight: Typography.bodyLarge.lineHeight,
    },
    time: {
      color: theme.disabled,
      fontSize: Typography.caption.fontSize,
      marginLeft: Spacing.xs,
      marginTop: Spacing.xs,
    },
    userBubble: {
      backgroundColor: theme.secondary,
      borderBottomRightRadius: 4,
      borderRadius: BorderRadius.large,
    },
    userBubbleWrapper: {
      alignItems: 'flex-end',
    },
    userContainer: {
      justifyContent: 'flex-end',
    },
    userText: {
      color: theme.white,
    },
    userTime: {
      marginLeft: 0,
      marginRight: Spacing.xs,
      textAlign: 'right',
    },
  });

  const bubbleStyle = [styles.bubble, isUser ? styles.userBubble : styles.aiBubble];

  const textStyle = [styles.text, isUser ? styles.userText : styles.aiText];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      {/* Аватар AI (опционально) */}
      {!isUser && (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}

      <View style={[styles.bubbleWrapper, isUser && styles.userBubbleWrapper]}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{message.content}</Text>
        </View>
        <Text style={[styles.time, isUser && styles.userTime]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {/* Аватар пользователя (опционально) */}
      {isUser && (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}
    </View>
  );
}
