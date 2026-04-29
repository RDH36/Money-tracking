import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

interface ProgressDotsProps {
  step: number;
  total?: number;
}

export function ProgressDots({ step, total = 8 }: ProgressDotsProps) {
  const v2 = useV2();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < step - 1;
        const current = i === step - 1;
        return (
          <View
            key={i}
            style={{
              flex: current ? 1.4 : 1,
              height: current ? 4 : 2,
              borderRadius: 999,
              backgroundColor: done || current ? v2.brand : v2.hairlineStrong,
            }}
          />
        );
      })}
      <Text
        style={{
          marginLeft: 8,
          fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700',
          color: v2.inkSubtle, letterSpacing: 0.4,
          fontVariant: ['tabular-nums'],
        }}
      >
        {step}/{total}
      </Text>
    </View>
  );
}

interface EyebrowLabelProps {
  children: React.ReactNode;
  color?: string;
}

export function EyebrowLabel({ children, color }: EyebrowLabelProps) {
  const v2 = useV2();
  return (
    <Text
      style={{
        fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
        letterSpacing: 1.5, textTransform: 'uppercase',
        color: color ?? v2.brand, marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

interface SpeechBubbleV2Props {
  children: React.ReactNode;
  /** Tail position relative to the bubble. */
  tail?: 'left' | 'right' | 'center';
  style?: any;
}

export function SpeechBubbleV2({ children, tail = 'right', style }: SpeechBubbleV2Props) {
  const v2 = useV2();
  const tailStyle: any = tail === 'center'
    ? { left: '50%', marginLeft: -6 }
    : tail === 'left'
      ? { right: 26 }
      : { left: 26 };
  return (
    <View
      style={[{
        maxWidth: 240, paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 16, backgroundColor: v2.bgSurface,
        borderWidth: 1, borderColor: v2.hairlineStrong,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 }, elevation: 4,
      }, style]}
    >
      <Text
        style={{
          fontFamily: v2.fontDisplay, fontWeight: '700',
          fontStyle: 'italic', fontSize: 14,
          color: v2.ink, letterSpacing: -0.1, lineHeight: 19,
          textAlign: tail === 'center' ? 'center' : 'left',
        }}
      >
        {children}
      </Text>
      <View
        style={{
          position: 'absolute', bottom: -6,
          width: 12, height: 12,
          backgroundColor: v2.bgSurface,
          borderRightWidth: 1, borderBottomWidth: 1,
          borderColor: v2.hairlineStrong,
          transform: [{ rotate: '45deg' }],
          ...tailStyle,
        }}
      />
    </View>
  );
}

/**
 * Speech bubble positioned above bubule's head, centered horizontally,
 * with a centered downward-pointing tail. Wrap inside a `position:relative`
 * parent containing the bubule image.
 */
interface BubuleHeadBubbleProps {
  children: React.ReactNode;
  /** Distance from the top of the parent (where bubule's head sits). */
  top?: number;
}
export function BubuleHeadBubble({ children, top = 30 }: BubuleHeadBubbleProps) {
  return (
    <View
      style={{
        position: 'absolute', top, left: 0, right: 0,
        alignItems: 'center', zIndex: 2,
      }}
      pointerEvents="none"
    >
      <SpeechBubbleV2 tail="center">{children}</SpeechBubbleV2>
    </View>
  );
}

interface PrimaryBtnProps {
  label: string;
  hint?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'dark' | 'brand';
}

export function PrimaryBtn({ label, hint, onPress, disabled, variant = 'dark' }: PrimaryBtnProps) {
  const v2 = useV2();
  const bg = variant === 'dark' ? v2.bgInk : v2.brand;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: bg,
        paddingVertical: 16, paddingHorizontal: 18,
        borderRadius: 999,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: disabled ? 0.5 : 1,
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 }, elevation: 6,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 15, fontWeight: '700',
          letterSpacing: 0.2, color: v2.inkOnDark,
        }}
      >
        {label}
      </Text>
      {hint ? (
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 11, fontWeight: '500',
            color: v2.inkOnDarkM, letterSpacing: 0.4,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

interface QuizOptionV2Props {
  emoji: string;
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}

export function QuizOptionV2({ emoji, label, hint, selected, onPress }: QuizOptionV2Props) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16, paddingHorizontal: 18,
        borderRadius: 16,
        backgroundColor: selected ? v2.brandSoft : v2.bgSurface,
        borderWidth: 1, borderColor: selected ? v2.brand : v2.hairline,
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}
    >
      <View
        style={{
          width: 42, height: 42, borderRadius: 12,
          backgroundColor: selected ? v2.bgSurface : v2.bgRaised,
          borderWidth: selected ? 1 : 0, borderColor: v2.brand + '30',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 22, lineHeight: 26 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 16, color: v2.ink, letterSpacing: -0.2, lineHeight: 20,
          }}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 11,
              color: v2.inkSubtle, marginTop: 2,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          width: 22, height: 22, borderRadius: 11,
          borderWidth: 1.5,
          borderColor: selected ? v2.brand : v2.hairlineStrong,
          backgroundColor: selected ? v2.brand : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {selected ? <Ionicons name="checkmark" size={12} color={v2.inkOnDark} /> : null}
      </View>
    </Pressable>
  );
}
