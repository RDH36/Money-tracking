import { useEffect } from 'react';
import { Modal, Pressable, View, Text as RNText, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts';
import { useSettingsStore } from '@/stores/settingsStore';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { buildDesignVars } from '@/components/ui/gluestack-ui-provider/config';
import { PrimaryButton } from '@/components/premium';

export type LockedFeature = 'account' | 'category' | 'theme';

interface LockedFeatureModalProps {
  feature: LockedFeature | null;
  /** Optional override message (e.g. for a specific theme name) */
  customTitle?: string;
  customBody?: string;
  onClose: () => void;
}

const FEATURE_META: Record<LockedFeature, { icon: string; color: string; titleKey: string; bodyKey: string }> = {
  account: {
    icon: 'wallet',
    color: '#3B82F6',
    titleKey: 'locked.accountTitle',
    bodyKey: 'locked.accountBody',
  },
  category: {
    icon: 'grid',
    color: '#8B5CF6',
    titleKey: 'locked.categoryTitle',
    bodyKey: 'locked.categoryBody',
  },
  theme: {
    icon: 'color-palette',
    color: '#EC4899',
    titleKey: 'locked.themeTitle',
    bodyKey: 'locked.themeBody',
  },
};

export function LockedFeatureModal({
  feature,
  customTitle,
  customBody,
  onClose,
}: LockedFeatureModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeId = useSettingsStore((state) => state.themeId);
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';

  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (feature === null) return;
    scale.value = 0.5;
    opacity.value = 0;
    scale.value = withSpring(1, { damping: 8, mass: 1, overshootClamping: false });
    opacity.value = withTiming(1, { duration: 200 });
  }, [feature]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (feature === null) return null;

  const meta = FEATURE_META[feature];
  const title = customTitle ?? t(meta.titleKey);
  const body = customBody ?? t(meta.bodyKey);
  const designVars = buildDesignVars(themeId, isDark);

  const handleViewAchievements = () => {
    onClose();
    router.push('/(tabs)/achievements' as any);
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView
        style={[designVars, { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}
      >
        {/* Backdrop — absolutely positioned so it doesn't wrap the content */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={onClose}
        />
        {/* Content — sibling of backdrop, receives its own touch events */}
        <Animated.View
          style={animatedStyle}
          className="rounded-xl bg-bg-overlay w-full max-w-[340px]"
        >
          <View className="items-center gap-4 p-6">
            <View
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: meta.color + '20',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="lock-closed" size={32} color={meta.color} />
            </View>
            <RNText
              className="font-display text-display-sm text-content-primary text-center"
            >
              {title}
            </RNText>
            <RNText className="text-content-secondary text-body-sm text-center">
              {body}
            </RNText>
            <View className="w-full gap-2 pt-2">
              <PrimaryButton
                label={t('locked.viewAchievements')}
                onPress={handleViewAchievements}
              />
              <Pressable onPress={onClose} className="py-3 items-center">
                <RNText className="text-content-tertiary font-ui text-ui-sm">
                  {t('common.cancel')}
                </RNText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
