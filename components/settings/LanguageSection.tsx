import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useLanguage } from '@/contexts';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n';
import { SectionLabel, SettingsCard } from '@/components/settings/v2';

const NATIVE: Record<string, string> = {
  fr: 'Français',
  mg: 'Malagasy',
  en: 'English',
};

export function LanguageSection() {
  const v2 = useV2();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <View>
      <SectionLabel>{t('languageV2.section')}</SectionLabel>
      <SettingsCard>
        {LANGUAGES.filter((lang) => lang.code !== 'mg').map((lang, i, arr) => {
          const isActive = language === lang.code;
          const isLast = i === arr.length - 1;
          return (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code as LanguageCode)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: v2.hairline,
              }}
            >
              <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}>
                  {lang.name}
                </Text>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle, fontStyle: 'italic', marginTop: 2 }}>
                  {NATIVE[lang.code] ?? lang.name}
                </Text>
              </View>
              {isActive ? (
                <View
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: v2.brand,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={13} color={v2.inkOnDark} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </SettingsCard>

      <View
        style={{
          marginTop: 14, padding: 14,
          borderRadius: 14,
          backgroundColor: v2.bgRaised,
          flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        }}
      >
        <Ionicons name="information-circle-outline" size={15} color={v2.inkSubtle} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, lineHeight: 17 }}>
          {t('languageV2.info')}
        </Text>
      </View>
    </View>
  );
}
