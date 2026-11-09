import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsRow } from '@/components/settings/v2';
import { useAppUpdateStore } from '@/stores/appUpdateStore';

/** Réglages : « Vérifier les mises à jour » (ignore la limite d'une fois par jour). */
export function UpdateSettingsRow() {
  const { t } = useTranslation();
  const phase = useAppUpdateStore((s) => s.phase);
  const check = useAppUpdateStore((s) => s.check);
  // Le statut ne s'affiche qu'après une vérification demandée ici.
  const [asked, setAsked] = useState(false);

  const status: Record<typeof phase, string | undefined> = {
    idle: undefined,
    checking: t('appUpdate.checking'),
    available: t('appUpdate.statusAvailable'),
    downloading: t('appUpdate.downloading'),
    downloaded: t('appUpdate.statusReady'),
    latest: t('appUpdate.latest'),
    unavailable: t('appUpdate.unavailable'),
  };
  const busy = phase === 'checking' || phase === 'downloading';

  return (
    <SettingsRow
      icon="refresh-outline"
      iconColor="#0E8C82"
      label={t('appUpdate.checkRow')}
      sublabel={asked || phase === 'downloading' || phase === 'downloaded' ? status[phase] : undefined}
      onPress={busy ? undefined : () => {
        setAsked(true);
        check('manual');
      }}
    />
  );
}
