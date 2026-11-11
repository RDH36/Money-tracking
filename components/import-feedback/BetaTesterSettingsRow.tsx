import { useTranslation } from 'react-i18next';
import { SettingsRow } from '@/components/settings/v2';
import { useImportFeedback } from '@/hooks/importFeedback/useImportFeedback';

/** Réglages : ligne « Testeur bêta ✓ », visible une fois l'avis sur l'import envoyé. */
export function BetaTesterSettingsRow() {
  const { t } = useTranslation();
  const { loaded, answered } = useImportFeedback();
  if (!loaded || !answered) return null;
  return (
    <SettingsRow
      icon="flask-outline"
      iconColor="#0E8C82"
      label={t('betaTester.settings.label')}
      sublabel={t('betaTester.settings.sublabel')}
    />
  );
}
