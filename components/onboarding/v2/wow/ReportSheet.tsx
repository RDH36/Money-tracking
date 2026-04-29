import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';
import { SpeechBubbleV2, PrimaryBtn } from '../Primitives';

export interface ReportCategory {
  key: string;
  label: string;
  amount: number;
  color: string;
  pct: number;
}

interface ReportSheetProps {
  categories: ReportCategory[];
  total: number;
  fmt: (n: number) => string;
  reportTitle: string;
  totalLabel: string;
  successMessage: string;
  ctaLabel: string;
  bubbleSpeech: string;
  onCta: () => void;
  insets: { bottom: number };
  overlayStyle: any;
  reportStyle: any;
}

export function ReportSheet({
  categories, total, fmt,
  reportTitle, totalLabel, successMessage, ctaLabel, bubbleSpeech,
  onCta, insets, overlayStyle, reportStyle,
}: ReportSheetProps) {
  const v2 = useV2();

  return (
    <>
      <Animated.View
        style={[{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
        }, overlayStyle]}
        pointerEvents="none"
      />
      <Animated.View
        style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, reportStyle]}
      >
        <View
          style={{
            backgroundColor: v2.bgBase,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingHorizontal: 20, paddingTop: 20,
            paddingBottom: insets.bottom + 24,
            borderTopWidth: 1, borderColor: v2.hairlineStrong,
          }}
        >
          <View
            style={{
              alignSelf: 'center', width: 38, height: 4, borderRadius: 999,
              backgroundColor: v2.hairlineStrong, marginBottom: 16,
            }}
          />

          <View style={{ alignItems: 'center', marginBottom: -8 }}>
            <SpeechBubbleV2 tail="center">{bubbleSpeech}</SpeechBubbleV2>
            <Image
              source={require('@/assets/images/bubule-enjoy.png')}
              style={{ width: 160, height: 160, marginTop: -4 }}
              contentFit="contain"
            />
          </View>

          <Text
            style={{
              textAlign: 'center', fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 22, color: v2.ink, letterSpacing: -0.4, lineHeight: 25,
              marginBottom: 14,
            }}
          >
            {reportTitle}
          </Text>

          <View
            style={{
              padding: 16, borderRadius: 14,
              borderWidth: 1, borderColor: v2.hairlineStrong,
              backgroundColor: v2.bgRaised,
            }}
          >
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
              }}
            >
              <Ionicons name="receipt-outline" size={13} color={v2.brand} />
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                  letterSpacing: 1.4, textTransform: 'uppercase',
                  color: v2.brand,
                }}
              >
                {reportTitle}
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {categories.map((c) => (
                <View key={c.key}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text
                      style={{
                        fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600',
                        color: v2.ink,
                      }}
                    >
                      {c.label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700',
                        color: v2.ink, fontVariant: ['tabular-nums'],
                      }}
                    >
                      {fmt(c.amount)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 5, borderRadius: 999,
                      backgroundColor: v2.hairline,
                    }}
                  >
                    <View
                      style={{
                        width: `${c.pct}%`, height: '100%',
                        borderRadius: 999, backgroundColor: c.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View
              style={{
                marginTop: 14, paddingTop: 12,
                borderTopWidth: 1, borderTopColor: v2.hairlineStrong,
                borderStyle: 'dashed',
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
              }}
            >
              <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 14, color: v2.ink }}>
                {totalLabel}
              </Text>
              <Text
                style={{
                  fontFamily: v2.fontDisplay, fontWeight: '700',
                  fontStyle: 'italic', fontSize: 22, color: v2.bad,
                  letterSpacing: -0.4, fontVariant: ['tabular-nums'],
                }}
              >
                −{fmt(total)}
              </Text>
            </View>
          </View>

          <Text
            style={{
              textAlign: 'center', marginTop: 14, paddingHorizontal: 12,
              fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, lineHeight: 17,
            }}
          >
            {successMessage}
          </Text>

          <View style={{ marginTop: 18 }}>
            <PrimaryBtn label={ctaLabel} onPress={onCta} />
          </View>
        </View>
      </Animated.View>
    </>
  );
}
