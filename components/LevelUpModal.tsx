import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';

interface LevelUpModalProps {
  level: number | null;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (level === null) return;

    scale.setValue(0.5);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [level]);

  if (level === null) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <VStack className="items-center p-6" space="md">
            <Text style={[styles.emoji]}>🎉</Text>
            <Text style={[styles.title, { color: theme.colors.primary }]}>
              {t('gamification.levelUp', { level })}
            </Text>
            <Text style={styles.message}>{t('gamification.levelUpMessage')}</Text>
            <Pressable
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.buttonText}>{t('gamification.continue')}</Text>
            </Pressable>
          </VStack>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '800' },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
