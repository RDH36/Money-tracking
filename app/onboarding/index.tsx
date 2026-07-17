import { useEffect, useState, useMemo } from 'react';
import { View, Text, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSpring, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { usePostHog } from 'posthog-react-native';
import { useV2 } from '@/constants/designTokensV2';
import { BubuleHeadBubble, PrimaryBtn, EyebrowLabel } from '@/components/onboarding/v2';
import { useBackup } from '@/hooks/useBackup';
import { BackupPasswordDialog } from '@/components/backup';
import type { BackupEnvelope } from '@/lib/backup';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FLOATING_EMOJIS = ['💰', '📊', '🎯', '✨', '🏦', '💎'];

function FloatingParticle({ emoji, index }: { emoji: string; index: number }) {
  const startX = useMemo(() => Math.random() * (SCREEN_WIDTH - 40), []);
  const startY = useMemo(() => Math.random() * (SCREEN_HEIGHT * 0.6) + SCREEN_HEIGHT * 0.1, []);
  const floatY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const drift = 15 + Math.random() * 10;
    const duration = 2500 + Math.random() * 1500;
    opacity.value = withDelay(index * 200 + 200, withTiming(0.18 + Math.random() * 0.1, { duration: 800 }));
    floatY.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(-drift, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(drift, { duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true,
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: startX, top: startY,
    opacity: opacity.value,
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const v2 = useV2();
  const [ready, setReady] = useState(false);
  const posthog = usePostHog();

  const { importing, error, setError, pickFile, doImport } = useBackup();
  const [pwOpen, setPwOpen] = useState(false);
  const [pending, setPending] = useState<BackupEnvelope | null>(null);

  const runImport = async (envelope: BackupEnvelope, password?: string) => {
    const ok = await doImport(envelope, password);
    if (ok) {
      posthog.capture('onboarding_import_completed');
      setPwOpen(false);
      // Le flag onboarding_completed vient de la sauvegarde → on entre dans l'app.
      router.replace('/(tabs)' as any);
    }
  };

  const handleImportPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    const picked = await pickFile();
    if (!picked || picked.canceled || !picked.envelope) return;
    if (picked.protected) {
      setPending(picked.envelope);
      setPwOpen(true);
    } else {
      runImport(picked.envelope);
    }
  };

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const line1Opacity = useSharedValue(0);
  const line1Y = useSharedValue(24);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(24);

  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 120 }));
    line1Opacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    line1Y.value = withDelay(900, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    ctaOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    ctaY.value = withDelay(1400, withSpring(0, { damping: 12, stiffness: 100 }));
    const timer = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const line1Style = useAnimatedStyle(() => ({
    opacity: line1Opacity.value,
    transform: [{ translateY: line1Y.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <View
      style={{
        flex: 1, backgroundColor: v2.bgBase,
        paddingTop: insets.top, paddingBottom: insets.bottom + 16,
      }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        {FLOATING_EMOJIS.map((emoji, i) => (
          <FloatingParticle key={i} emoji={emoji} index={i} />
        ))}
      </View>

      <View style={{ paddingTop: 16, alignItems: 'center' }}>
        <EyebrowLabel>{t('onboarding.appName')}</EyebrowLabel>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Animated.View style={[logoStyle, { alignItems: 'center' }]}>
          <View style={{ position: 'relative', width: 460, height: 460 }}>
            <BubuleHeadBubble top={50}>{t('welcome.speechBubble')}</BubuleHeadBubble>
            <Image
              source={require('@/assets/images/bubble-hello.png')}
              style={{ width: 460, height: 460 }}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={[line1Style, { paddingHorizontal: 8, alignItems: 'center', marginTop: 14 }]}>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 32, color: v2.ink, letterSpacing: -0.8,
              lineHeight: 36, textAlign: 'center',
            }}
          >
            {t('welcome.title')}
          </Text>
          <Text
            style={{
              marginTop: 12, fontFamily: v2.fontUI, fontSize: 14,
              color: v2.inkMuted, lineHeight: 21, textAlign: 'center',
            }}
          >
            {t('welcome.subtitle')}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[ctaStyle, { paddingHorizontal: 20 }]}>
        <PrimaryBtn
          label={t('welcome.cta')}
          disabled={!ready}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            posthog.capture('onboarding_started');
            router.push('/onboarding/quiz-1');
          }}
        />
        <Pressable
          onPress={handleImportPress}
          disabled={!ready || importing}
          hitSlop={8}
          style={{ marginTop: 16, alignItems: 'center', minHeight: 20, justifyContent: 'center' }}
        >
          {importing ? (
            <ActivityIndicator size="small" color={v2.inkMuted} />
          ) : (
            <Text
              style={{
                textAlign: 'center', fontFamily: v2.fontUI, fontSize: 13,
                fontWeight: '700', color: v2.brand, textDecorationLine: 'underline',
              }}
            >
              {t('welcome.importCta')}
            </Text>
          )}
        </Pressable>

        {error && !pwOpen && error !== 'WRONG_PASSWORD' ? (
          <Text
            style={{
              textAlign: 'center', marginTop: 8,
              fontFamily: v2.fontUI, fontSize: 12, color: v2.bad,
            }}
          >
            {t([`dataBackupV2.errors.${error}`, 'dataBackupV2.errors.generic'])}
          </Text>
        ) : null}
      </Animated.View>

      <BackupPasswordDialog
        isOpen={pwOpen}
        mode="enter"
        loading={importing}
        errorText={error === 'WRONG_PASSWORD' ? t('dataBackupV2.errors.WRONG_PASSWORD') : null}
        onSubmit={(pw) => pending && runImport(pending, pw)}
        onClose={() => { setPwOpen(false); setError(null); }}
      />
    </View>
  );
}
