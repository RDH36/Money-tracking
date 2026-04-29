import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { CenterDialog } from '@/components/ui/CenterDialog';
import { DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import { UNLOCK_KEYS } from '@/lib/gamification/unlocks';

interface FeatureUnlockedModalProps {
  unlockKey: string | null;
  onClose: () => void;
}

interface UnlockMeta {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  color: string;
  titleKey: string;
  descKey: string;
}

const UNLOCK_META: Record<string, UnlockMeta> = {
  [UNLOCK_KEYS.CATEGORY_SLOT_PLUS_1]: { icon: 'grid-outline', color: '#8B5CF6', titleKey: 'unlock.categorySlotTitle', descKey: 'unlock.categorySlot1Desc' },
  [UNLOCK_KEYS.CATEGORY_SLOT_PLUS_2]: { icon: 'grid-outline', color: '#7C3AED', titleKey: 'unlock.categorySlotTitle', descKey: 'unlock.categorySlot2Desc' },
  [UNLOCK_KEYS.ACCOUNT_SLOT_PLUS_1]: { icon: 'wallet-outline', color: '#3B82F6', titleKey: 'unlock.accountSlotTitle', descKey: 'unlock.accountSlot1Desc' },
  [UNLOCK_KEYS.STREAK_FREEZE_PLUS_1]: { icon: 'snow-outline', color: '#06B6D4', titleKey: 'unlock.freezeTitle', descKey: 'unlock.freeze1Desc' },
  [UNLOCK_KEYS.STREAK_FREEZE_PLUS_2]: { icon: 'snow-outline', color: '#0891B2', titleKey: 'unlock.freezeTitle', descKey: 'unlock.freeze2Desc' },
  [UNLOCK_KEYS.THEME_GOLD]: { icon: 'color-palette-outline', color: '#D4AF37', titleKey: 'unlock.themeTitle', descKey: 'unlock.themeGoldDesc' },
  [UNLOCK_KEYS.THEME_PLATINUM]: { icon: 'color-palette-outline', color: '#B8B8C1', titleKey: 'unlock.themeTitle', descKey: 'unlock.themePlatinumDesc' },
  [UNLOCK_KEYS.THEME_MIDNIGHT]: { icon: 'color-palette-outline', color: '#1E293B', titleKey: 'unlock.themeTitle', descKey: 'unlock.themeMidnightDesc' },
  [UNLOCK_KEYS.THEME_RUBY]: { icon: 'color-palette-outline', color: '#E11D48', titleKey: 'unlock.themeTitle', descKey: 'unlock.themeRubyDesc' },
  [UNLOCK_KEYS.THEME_EMERALD]: { icon: 'color-palette-outline', color: '#10B981', titleKey: 'unlock.themeTitle', descKey: 'unlock.themeEmeraldDesc' },
  [UNLOCK_KEYS.THEME_ALL_PREMIUM]: { icon: 'sparkles-outline', color: '#F59E0B', titleKey: 'unlock.themeTitle', descKey: 'unlock.themeAllDesc' },
  [UNLOCK_KEYS.THEME_PRISM]: { icon: 'prism-outline', color: '#EC4899', titleKey: 'unlock.themeTitle', descKey: 'unlock.themePrismDesc' },
};

export function FeatureUnlockedModal({ unlockKey, onClose }: FeatureUnlockedModalProps) {
  const { t } = useTranslation();
  const v2 = useV2();

  const meta: UnlockMeta = unlockKey
    ? UNLOCK_META[unlockKey] ?? {
        icon: 'gift-outline', color: v2.brand,
        titleKey: 'unlock.genericTitle', descKey: 'unlock.genericDesc',
      }
    : { icon: 'gift-outline', color: v2.brand, titleKey: '', descKey: '' };

  return (
    <CenterDialog
      isOpen={unlockKey !== null}
      onClose={onClose}
      title={t('unlock.featureUnlocked')}
      iconName={meta.icon}
      iconColor={meta.color}
      iconBg={meta.color + '22'}
      variant="celebration"
      showClose={false}
      maxWidth={380}
    >
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 16, color: v2.ink, letterSpacing: -0.2,
            textAlign: 'center', marginBottom: 6,
          }}
        >
          {t(meta.titleKey)}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13,
            color: v2.inkMuted, textAlign: 'center', lineHeight: 19,
            marginBottom: 16,
          }}
        >
          {t(meta.descKey)}
        </Text>
        <View style={{ width: '100%' }}>
          <DialogPrimaryBtn label={t('gamification.continue')} onPress={onClose} />
        </View>
      </View>
    </CenterDialog>
  );
}
