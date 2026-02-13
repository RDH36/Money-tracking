import { useState, useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseMultipleInputs, type ParsedVoiceInput } from '@/lib/voiceParser';
import type { Category } from '@/types';

interface VoiceInputButtonProps {
  onResult: (data: ParsedVoiceInput[]) => Promise<void>;
  categories: Category[];
  lang: string;
}

export function VoiceInputButton({ onResult, categories, lang }: VoiceInputButtonProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  const { isListening, transcript, error, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [parseError, setParseError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const scale = useSharedValue(1);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      scale.value = withRepeat(withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Parse transcript and add directly when listening stops
  useEffect(() => {
    if (!isListening && transcript && !isAdding) {
      const results = parseMultipleInputs(transcript);
      if (results.length > 0) {
        setIsAdding(true);
        setParseError(false);
        onResult(results).then(() => {
          setAddedCount(results.length);
          setTimeout(() => { setAddedCount(null); resetTranscript(); }, 3000);
        }).finally(() => setIsAdding(false));
      } else {
        setParseError(true);
      }
    }
  }, [isListening, transcript]);

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      setAddedCount(null);
      setParseError(false);
      startListening(lang);
    }
  };

  const handleCancel = () => {
    setAddedCount(null);
    setParseError(false);
    resetTranscript();
  };

  // Error display
  if (error === 'permission_denied') {
    return (
      <VStack space="sm" className="items-center py-4">
        <Ionicons name="mic-off-outline" size={32} color="#DC2626" />
        <Text className="text-error-600 text-sm text-center">{t('voice.noPermission')}</Text>
        <Button size="sm" variant="outline" onPress={handleCancel}>
          <ButtonText>{t('common.ok')}</ButtonText>
        </Button>
      </VStack>
    );
  }

  // Success feedback
  if (addedCount !== null) {
    return (
      <VStack space="sm" className="items-center py-4">
        <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
        <Text className="text-sm font-semibold" style={{ color: '#22C55E' }}>
          {t('planification.itemsAdded', { count: addedCount })}
        </Text>
        {transcript && <Text className="text-typography-400 text-xs italic">&quot;{transcript}&quot;</Text>}
      </VStack>
    );
  }

  // Parse error
  if (parseError) {
    return (
      <VStack space="sm" className="items-center py-4">
        <Text className="text-warning-600 text-sm text-center">{t('voice.parseError')}</Text>
        {transcript && <Text className="text-typography-400 text-xs italic">&quot;{transcript}&quot;</Text>}
        <HStack space="sm">
          <Button size="sm" variant="outline" onPress={handleCancel}>
            <ButtonText style={{ color: colors.textMuted }}>{t('common.cancel')}</ButtonText>
          </Button>
          <Button size="sm" style={{ backgroundColor: theme.colors.primary }} onPress={handleMicPress}>
            <ButtonText className="text-white">{t('voice.tapToSpeak')}</ButtonText>
          </Button>
        </HStack>
      </VStack>
    );
  }

  // Default: mic button
  return (
    <VStack space="sm" className="items-center py-2">
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handleMicPress}
          style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: isListening ? '#EF4444' : theme.colors.primary,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
          }}
        >
          <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={28} color="white" />
        </Pressable>
      </Animated.View>
      <Text className="text-typography-500 text-xs text-center">
        {isListening ? t('voice.listening') : t('voice.tapToSpeak')}
      </Text>
      {!isListening && <Text className="text-typography-400 text-xs text-center">{t('voice.hint')}</Text>}
    </VStack>
  );
}
