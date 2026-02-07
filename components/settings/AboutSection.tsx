import { useTranslation } from 'react-i18next';
import { useTutorialStatus } from "@/hooks";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { SettingRow } from "./SettingRow";
import { SettingSection } from "./SettingSection";

const APP_VERSION = "1.0.5";

const openLink = (url: string) => Linking.openURL(url);

export function AboutSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reset } = useTutorialStatus();

  const handleReplayTutorial = async () => {
    await reset();
    router.push("/tutorial");
  };

  return (
    <SettingSection title={t('settings.about')}>
      <SettingRow label={t('settings.version')} rightText={APP_VERSION} />
      <SettingRow label={t('settings.reviewTutorial')} onPress={handleReplayTutorial} />
      <SettingRow
        label={t('settings.developer')}
        rightText="RDH36"
        onPress={() => openLink("https://github.com/RDH36")}
        external
      />
      <SettingRow
        label={t('settings.privacyPolicy')}
        onPress={() => openLink("https://www.mitsitsy.app/privacy")}
        external
      />
      <SettingRow
        label={t('settings.termsOfUse')}
        onPress={() => openLink("https://www.mitsitsy.app/terms")}
        external
        isLast
      />
    </SettingSection>
  );
}
