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
    container: {
      flexDirection: 'row',
      marginVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    userContainer: {
      justifyContent: 'flex-end',
    },
    avatarPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: Spacing.sm,
    },
    avatarText: {
      fontSize: 18,
    },
    bubbleWrapper: {
      maxWidth: '75%',
    },
    userBubbleWrapper: {
      alignItems: 'flex-end',
    },
    bubble: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + Spacing.xs,
      ...Shadows.level1,
    },
    aiBubble: {
      backgroundColor: theme.primaryLight,
      borderRadius: BorderRadius.large,
      borderBottomLeftRadius: 4,
    },
    userBubble: {
      backgroundColor: theme.secondary,
      borderRadius: BorderRadius.large,
      borderBottomRightRadius: 4,
    },
    text: {
      fontSize: Typography.bodyLarge.fontSize,
      lineHeight: Typography.bodyLarge.lineHeight,
    },
    aiText: {
      color: theme.text,
    },
    userText: {
      color: theme.white,
    },
    time: {
      fontSize: Typography.caption.fontSize,
      color: theme.disabled,
      marginTop: Spacing.xs,
      marginLeft: Spacing.xs,
    },
    userTime: {
      textAlign: 'right',
      marginLeft: 0,
      marginRight: Spacing.xs,
    },
  });

  const bubbleStyle = [
    styles.bubble,
    isUser ? styles.userBubble : styles.aiBubble,
  ];

  const textStyle = [
    styles.text,
    isUser ? styles.userText : styles.aiText,
  ];

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
