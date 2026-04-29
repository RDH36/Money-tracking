import { View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ImageSourcePropType } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';
import { ProgressDots, EyebrowLabel, BubuleHeadBubble, QuizOptionV2 } from './Primitives';

export interface QuizOption {
  key: string;
  emoji: string;
  label: string;
  hint?: string;
}

interface QuizScreenV2Props {
  step: number;
  questionLabel: string;
  title: React.ReactNode;
  bubbleSpeech: string;
  bubbleImage: ImageSourcePropType;
  options: QuizOption[];
  selected: string | null;
  onSelect: (key: string) => void;
}

export function QuizScreenV2({
  step, questionLabel, title, bubbleSpeech, bubbleImage,
  options, selected, onSelect,
}: QuizScreenV2Props) {
  const v2 = useV2();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: v2.bgBase }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <ProgressDots step={step} />
        <EyebrowLabel>{questionLabel}</EyebrowLabel>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 28, color: v2.ink, letterSpacing: -0.6, lineHeight: 32,
          }}
        >
          {title}
        </Text>
      </View>

      <View
        style={{
          alignItems: 'center', position: 'relative',
          marginTop: -8, marginBottom: -32,
        }}
      >
        <View style={{ position: 'relative', width: 320, height: 320 }}>
          <BubuleHeadBubble top={20}>{bubbleSpeech}</BubuleHeadBubble>
          <Image
            source={bubbleImage}
            style={{ width: 320, height: 320 }}
            contentFit="contain"
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {options.map((opt) => (
          <QuizOptionV2
            key={opt.key}
            emoji={opt.emoji}
            label={opt.label}
            hint={opt.hint}
            selected={selected === opt.key}
            onPress={() => onSelect(opt.key)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
