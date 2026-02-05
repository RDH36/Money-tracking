import { useTutorialStatus } from "@/hooks";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { SettingRow } from "./SettingRow";
import { SettingSection } from "./SettingSection";

const APP_VERSION = "1.0.5";

const openLink = (url: string) => Linking.openURL(url);

export function AboutSection() {
  const router = useRouter();
  const { reset } = useTutorialStatus();

  const handleReplayTutorial = async () => {
    await reset();
    router.push("/tutorial");
  };

  return (
    <SettingSection title="À propos">
      <SettingRow label="Version" rightText={APP_VERSION} />
      <SettingRow label="Revoir le tutoriel" onPress={handleReplayTutorial} />
      <SettingRow
        label="Développeur"
        rightText="RDH36"
        onPress={() => openLink("https://github.com/RDH36")}
        external
      />
      <SettingRow
        label="Politique de confidentialité"
        onPress={() => openLink("https://www.mitsitsy.app/privacy")}
        external
      />
      <SettingRow
        label="Conditions d'utilisation"
        onPress={() => openLink("https://www.mitsitsy.app/terms")}
        external
        isLast
      />
    </SettingSection>
  );
}
