import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import { useOnboarding } from '@/hooks';
import { useV2 } from '@/constants/designTokensV2';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { ProgressDots, EyebrowLabel, PrimaryBtn } from '@/components/onboarding/v2';
import type { ComponentProps } from 'react';

const TERMS_URL = 'https://www.mitsitsy.app/terms';
const PRIVACY_URL = 'https://www.mitsitsy.app/privacy';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const { t } = useTranslation();
  const { bankBalance, cashBalance } = useLocalSearchParams<{ bankBalance: string; cashBalance: string }>();
  const { saveOnboardingData, isLoading, categories } = useOnboarding();
  const posthog = usePostHog();

  const defaultIds = new Set(DEFAULT_CATEGORIES.map((c) => c.id));
  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set(categories.map((c) => c.id));
    initial.add('other');
    return initial;
  });

  const toggle = (id: string) => {
    if (id === 'other') return; // Always required
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await saveOnboardingData({
      bankBalance: bankBalance || '0',
      cashBalance: cashBalance || '0',
      selectedCategories: selected,
    });
    if (ok) {
      posthog.capture('onboarding_completed', { categories_selected: selected.size });
      router.replace('/add');
    }
  };

  return (
    <View
      style={{
        flex: 1, backgroundColor: v2.bgBase,
        paddingTop: insets.top, paddingBottom: insets.bottom + 16,
      }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <ProgressDots step={8} />
        <EyebrowLabel>{t('onboarding.lastStep')}</EyebrowLabel>
        <Text
          style={{
            marginTop: 4,
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 30, color: v2.ink, letterSpacing: -0.7, lineHeight: 34,
          }}
        >
          {t('onboarding.categoriesTitleStart')}{' '}
          <Text style={{ fontStyle: 'italic', color: v2.brand }}>
            {t('onboarding.categoriesTitleAccent')}
          </Text>
        </Text>
        <Text
          style={{
            marginTop: 10, fontFamily: v2.fontUI, fontSize: 14,
            color: v2.inkMuted, lineHeight: 20,
          }}
        >
          {t('onboarding.categoriesSubtitle')}
        </Text>

        <View
          style={{
            alignSelf: 'flex-start', marginTop: 16,
            paddingVertical: 8, paddingHorizontal: 14,
            backgroundColor: v2.bgRaised, borderRadius: 999,
            flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700',
              color: v2.brand, fontVariant: ['tabular-nums'],
            }}
          >
            {selected.size}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted }}>
            {t('onboarding.categoriesSelected')} · max 12
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 18 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {categories.map((c) => {
            const isSel = selected.has(c.id);
            const isLocked = c.id === 'other';
            const color = c.color;
            const iconName = c.icon as IoniconName;
            const label = defaultIds.has(c.id) ? t(`categories.${c.id}`) : c.name;
            return (
              <Pressable
                key={c.id}
                onPress={() => toggle(c.id)}
                disabled={isLocked}
                style={{
                  flexBasis: '47.5%', flexGrow: 1,
                  paddingVertical: 16, paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: isSel ? v2.bgSurface : 'transparent',
                  borderWidth: 1,
                  borderStyle: isSel ? 'solid' : 'dashed',
                  borderColor: isSel ? color + '55' : v2.hairlineStrong,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  opacity: isSel ? 1 : 0.75,
                }}
              >
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: isSel ? color + '22' : v2.hairline,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name={iconName} size={18} color={isSel ? color : v2.inkSubtle} />
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700',
                    color: isSel ? v2.ink : v2.inkMuted,
                  }}
                >
                  {label}
                </Text>
                {isLocked ? (
                  <View
                    style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: v2.bgRaised,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="lock-closed" size={10} color={v2.inkSubtle} />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 20, height: 20, borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: isSel ? color : v2.hairlineStrong,
                      backgroundColor: isSel ? color : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isSel ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <PrimaryBtn
          label={
            isLoading
              ? t('common.loading')
              : `${t('onboarding.finish')} · ${selected.size}`
          }
          onPress={handleFinish}
          disabled={isLoading || selected.size === 0}
        />
        <Text
          style={{
            textAlign: 'center', marginTop: 10,
            fontFamily: v2.fontUI, fontSize: 11, fontStyle: 'italic',
            color: v2.inkSubtle,
          }}
        >
          {t('onboarding.categoriesHint')}
        </Text>

        <Text
          style={{
            textAlign: 'center', marginTop: 12, paddingHorizontal: 8,
            fontFamily: v2.fontUI, fontSize: 11, lineHeight: 16,
            color: v2.inkSubtle,
          }}
        >
          {t('onboarding.termsAcceptOnFinish')}{' '}
          <Text
            onPress={() => Linking.openURL(TERMS_URL)}
            style={{ color: v2.brand, fontWeight: '700', textDecorationLine: 'underline' }}
          >
            {t('onboarding.termsLink')}
          </Text>
          {' '}{t('onboarding.and')}{' '}
          <Text
            onPress={() => Linking.openURL(PRIVACY_URL)}
            style={{ color: v2.brand, fontWeight: '700', textDecorationLine: 'underline' }}
          >
            {t('onboarding.privacyLink')}
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}
