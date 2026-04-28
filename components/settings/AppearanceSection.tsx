import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { THEMES } from '@/constants/colors';
import { useUnlocksStore } from '@/stores/unlocksStore';
import { CURRENCIES } from '@/constants/currencies';
import { LockedFeatureModal } from '@/components/LockedFeatureModal';
import { useV2 } from '@/constants/designTokensV2';
import { ColorMode } from '@/stores/settingsStore';
import {
  SectionLabel,
  SettingsCard,
  SettingsRow,
  SettingsRadio,
  SettingsToggle,
} from '@/components/settings/v2';

interface AppearanceSectionProps {
  themeId: string;
  colorMode: ColorMode;
  currencyCode: string;
  tipsEnabled: boolean;
  onThemeChange: (id: string) => void;
  onColorModeChange: (mode: ColorMode) => void;
  onCurrencyChange: (code: string) => void;
  onTipsEnabledChange: (enabled: boolean) => void;
}

export function AppearanceSection({
  themeId,
  colorMode,
  currencyCode,
  tipsEnabled,
  onThemeChange,
  onColorModeChange,
  onCurrencyChange,
  onTipsEnabledChange,
}: AppearanceSectionProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const unlocks = useUnlocksStore((s) => s.unlocks);
  const [showThemeLocked, setShowThemeLocked] = useState(false);

  const MODES: { value: ColorMode; tk: string; icon: any }[] = [
    { value: 'light', tk: 'appearanceV2.modeLight', icon: 'sunny-outline' },
    { value: 'system', tk: 'appearanceV2.modeAuto', icon: 'phone-portrait-outline' },
    { value: 'dark', tk: 'appearanceV2.modeDark', icon: 'moon-outline' },
  ];

  return (
    <View>
      <SectionLabel>{t('appearanceV2.themeSectionLabel')}</SectionLabel>
      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {THEMES.map((th) => {
          const isActive = themeId === th.id;
          const allPremiumUnlocked = unlocks.has('theme_all_premium');
          const isLocked = !!th.unlockKey && !allPremiumUnlocked && !unlocks.has(th.unlockKey);
          const swatch = th.colors.primary;
          const colorNameKey = `settings.color${th.id.charAt(0).toUpperCase() + th.id.slice(1)}`;
          return (
            <Pressable
              key={th.id}
              onPress={() => (isLocked ? setShowThemeLocked(true) : onThemeChange(th.id))}
              style={{
                width: '23%',
                paddingVertical: 12,
                paddingHorizontal: 6,
                alignItems: 'center',
                gap: 8,
                backgroundColor: isActive ? v2.bgRaised : 'transparent',
                borderWidth: isActive ? 1.5 : 1,
                borderColor: isActive ? swatch : v2.hairline,
                borderRadius: 12,
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <View style={{ borderRadius: 15, overflow: 'hidden' }}>
                <LinearGradient
                  colors={[swatch, swatch + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 30, height: 30 }}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700',
                  color: isActive ? swatch : v2.inkMuted,
                  maxWidth: '100%',
                }}
              >
                {t(colorNameKey, th.name)}
              </Text>
              {isLocked ? (
                <View
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: v2.inkSubtle,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="lock-closed" size={8} color="#FFF" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>{t('appearanceV2.modeSectionLabel')}</SectionLabel>
      <View
        style={{
          backgroundColor: v2.bgRaised,
          borderRadius: 12,
          padding: 4,
          flexDirection: 'row',
          gap: 4,
        }}
      >
        {MODES.map((m) => {
          const active = m.value === colorMode;
          return (
            <Pressable
              key={m.value}
              onPress={() => onColorModeChange(m.value)}
              style={{
                flex: 1, paddingVertical: 10, paddingHorizontal: 8,
                borderRadius: 9, alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 6,
                backgroundColor: active ? v2.bgInk : 'transparent',
              }}
            >
              <Ionicons name={m.icon} size={14} color={active ? v2.inkOnDark : v2.inkSubtle} />
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700',
                  letterSpacing: 0.2,
                  color: active ? v2.inkOnDark : v2.inkMuted,
                }}
              >
                {t(m.tk)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>{t('appearanceV2.currencySectionLabel')}</SectionLabel>
      <SettingsCard>
        {CURRENCIES.map((c, i) => {
          const active = currencyCode === c.code;
          const isLast = i === CURRENCIES.length - 1;
          return (
            <Pressable
              key={c.code}
              onPress={() => onCurrencyChange(c.code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: v2.hairline,
              }}
            >
              <Text style={{ fontSize: 22 }}>{c.symbol}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}>
                  {c.name}
                </Text>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', letterSpacing: 1, color: v2.inkSubtle, marginTop: 2 }}>
                  {c.code}
                </Text>
              </View>
              <SettingsRadio value={active} />
            </Pressable>
          );
        })}
      </SettingsCard>

      <SectionLabel>{t('appearanceV2.tipsSectionLabel')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="bulb-outline"
          iconColor={v2.brand}
          label={t('appearanceV2.tipsLabel')}
          sublabel={t('appearanceV2.tipsSublabel')}
          right={<SettingsToggle value={tipsEnabled} onChange={onTipsEnabledChange} />}
          isLast
        />
      </SettingsCard>

      <LockedFeatureModal
        feature={showThemeLocked ? 'theme' : null}
        onClose={() => setShowThemeLocked(false)}
      />
    </View>
  );
}
