import { useEffect } from 'react';
import { Modal, Pressable, View, Text as RNText } from 'react-native';
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
import { UNLOCK_KEYS } from '@/lib/gamification/unlocks';

interface FeatureUnlockedModalProps {
  unlockKey: string | null;
  onClose: () => void;
}

interface UnlockMeta {
  icon: string;
  color: string;
  titleKey: string;
  descKey: string;
}

const UNLOCK_META: Record<string, UnlockMeta> = {
  [UNLOCK_KEYS.CATEGORY_SLOT_PLUS_1]: {
    icon: 'grid', color: '#8B5CF6',
    titleKey: 'unlock.categorySlotTitle', descKey: 'unlock.categorySlot1Desc',
  },
  [UNLOCK_KEYS.CATEGORY_SLOT_PLUS_2]: {
    icon: 'grid', color: '#7C3AED',
    titleKey: 'unlock.categorySlotTitle', descKey: 'unlock.categorySlot2Desc',
  },
  [UNLOCK_KEYS.ACCOUNT_SLOT_PLUS_1]: {
    icon: 'wallet', color: '#3B82F6',
    titleKey: 'unlock.accountSlotTitle', descKey: 'unlock.accountSlot1Desc',
  },
  [UNLOCK_KEYS.STREAK_FREEZE_PLUS_1]: {
    icon: 'snow', color: '#06B6D4',
    titleKey: 'unlock.freezeTitle', descKey: 'unlock.freeze1Desc',
  },
  [UNLOCK_KEYS.STREAK_FREEZE_PLUS_2]: {
    icon: 'snow', color: '#0891B2',
    titleKey: 'unlock.freezeTitle', descKey: 'unlock.freeze2Desc',
  },
  [UNLOCK_KEYS.THEME_GOLD]: {
    icon: 'color-palette', color: '#D4AF37',
    titleKey: 'unlock.themeTitle', descKey: 'unlock.themeGoldDesc',
  },
  [UNLOCK_KEYS.THEME_PLATINUM]: {
    icon: 'color-palette', color: '#B8B8C1',
    titleKey: 'unlock.themeTitle', descKey: 'unlock.themePlatinumDesc',
  },
  [UNLOCK_KEYS.THEME_MIDNIGHT]: {
    icon: 'color-palette', color: '#1E293B',
    titleKey: 'unlock.themeTitle', descKey: 'unlock.themeMidnightDesc',
  },
  [UNLOCK_KEYS.THEME_RUBY]: {
    icon: 'color-palette', color: '#E11D48',
    titleKey: 'unlock.themeTitle', descKey: 'unlock.themeRubyDesc',
  },
  [UNLOCK_KEYS.THEME_EMERALD]: {
    icon: 'color-palette', color: '#10B981',
    titleKey: 'unlock.themeTitle', descKey: 'unlock.themeEmeraldDesc',
  },
  [UNLOCK_KEYS.THEME_ALL_PREMIUM]: {
    icon: 'sparkles', color: '#F59E0B',
    titleKey: 'unlock.themeTitle', descKey: 'unlock.themeAllDesc',
  },
  [UNLOCK_KEYS.THEME_PRISM]: {
    icon: 'prism', color: '#EC4899',
    titleKey: 'unlock.themeTitle', descKey: 'unlock.themePrismDesc',
  },
};

export function FeatureUnlockedModal({ unlockKey, onClose }: FeatureUnlockedModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeId = useSettingsStore((state) => state.themeId);
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';

  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (unlockKey === null) return;
    scale.value = 0.5;
    opacity.value = 0;
    scale.value = withSpring(1, { damping: 8, mass: 1, overshootClamping: false });
    opacity.value = withTiming(1, { duration: 200 });
  }, [unlockKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (unlockKey === null) return null;

  const meta = UNLOCK_META[unlockKey] ?? {
    icon: 'gift',
    color: theme.colors.primary,
    titleKey: 'unlock.genericTitle',
    descKey: 'unlock.genericDesc',
  };

  const designVars = buildDesignVars(themeId, isDark);

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View style={[designVars, { flex: 1 }]}>
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={onClose}
        >
          <Animated.View
            style={animatedStyle}
            className="rounded-xl bg-bg-overlay w-[300px]"
          >
            <View className="items-center gap-4 p-6">
              <View
                style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: meta.color + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name={meta.icon as any} size={40} color={meta.color} />
              </View>
              <RNText
                className="font-display text-display-md text-center"
                style={{ color: meta.color }}
              >
                {t('unlock.featureUnlocked')}
              </RNText>
              <RNText className="font-ui text-ui-md text-content-primary text-center">
                {t(meta.titleKey)}
              </RNText>
              <RNText className="text-content-secondary text-body-sm text-center">
                {t(meta.descKey)}
              </RNText>
              <PrimaryButton label={t('gamification.continue')} onPress={onClose} />
            </View>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}
