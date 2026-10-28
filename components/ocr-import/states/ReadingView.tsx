import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { EaseView } from 'react-native-ease';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface ReadingViewProps {
  uri: string | null;
  /** Captures déjà lues. */
  done: number;
  total: number;
}

const THUMB_W = 132;
const THUMB_H = 264;

/** Lecture en cours : miniature de la capture lue, ligne de balayage, avancement. */
export function ReadingView({ uri, done, total }: ReadingViewProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const current = Math.min(done + 1, total);
  const ratio = total > 0 ? done / total : 0;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View
        style={{
          width: THUMB_W, height: THUMB_H, borderRadius: 18, overflow: 'hidden',
          backgroundColor: v2.bgRaised, borderWidth: 1, borderColor: v2.hairlineStrong,
        }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
        ) : null}
        <EaseView
          initialAnimate={{ translateY: 0 }}
          animate={{ translateY: THUMB_H - 3 }}
          transition={{ type: 'timing', duration: 1400, easing: 'easeInOut', loop: 'reverse' }}
          style={{
            position: 'absolute', left: 0, right: 0, top: 0, height: 3,
            backgroundColor: v2.brand, opacity: 0.85,
          }}
        />
      </View>

      <Text
        style={{
          marginTop: 22, fontFamily: v2.fontDisplay, fontSize: 20, fontWeight: '700',
          color: v2.ink, textAlign: 'center', letterSpacing: -0.4,
        }}
      >
        {t('ocrImport.readingTitle', { count: total })}
      </Text>
      {total > 1 ? (
        <Text style={{ marginTop: 4, fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, fontVariant: ['tabular-nums'] }}>
          {t('ocrImport.readingStep', { current, total })}
        </Text>
      ) : null}

      <View style={{ marginTop: 14, alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: v2.bgRaised, overflow: 'hidden' }}>
        <EaseView
          animate={{ scaleX: Math.max(ratio, 0.04) }}
          transformOrigin={{ x: 0, y: 0.5 }}
          transition={{ type: 'timing', duration: 300, easing: 'easeOut' }}
          style={{ height: 6, borderRadius: 3, backgroundColor: v2.brand }}
        />
      </View>

      <Text style={{ marginTop: 14, fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 19, color: v2.inkSubtle, textAlign: 'center' }}>
        {t('ocrImport.readingHint')}
      </Text>
    </View>
  );
}
