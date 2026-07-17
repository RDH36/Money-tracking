import { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';
import { SectionLabel, SettingsCard, SettingsRow } from '@/components/settings/v2';
import { SettingsToggle } from '@/components/settings/v2/SettingsToggle';
import { DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BackupPasswordDialog } from '@/components/backup';
import { useBackup } from '@/hooks/useBackup';
import type { BackupEnvelope } from '@/lib/backup';
import { useV2 } from '@/constants/designTokensV2';

type PwMode = 'set' | 'enter';

export default function DataBackupPage() {
  const { t } = useTranslation();
  const v2 = useV2();
  const posthog = usePostHog();
  const { exporting, importing, error, setError, doExport, pickFile, doImport } = useBackup();

  const [protect, setProtect] = useState(false);
  const [pwMode, setPwMode] = useState<PwMode>('set');
  const [pwOpen, setPwOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<BackupEnvelope | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const errorText = error ? t([`dataBackupV2.errors.${error}`, 'dataBackupV2.errors.generic']) : null;

  const runExport = async (password?: string) => {
    const method = await doExport(password);
    if (method) {
      posthog.capture('backup_exported', { protected: !!password, method });
      setPwOpen(false);
      setSuccess(t(method === 'download' ? 'dataBackupV2.exportDownloaded' : 'dataBackupV2.exportShared'));
    }
  };

  const handleExportPress = () => {
    setSuccess(null);
    setError(null);
    if (protect) {
      setPwMode('set');
      setPwOpen(true);
    } else {
      runExport();
    }
  };

  const handleImportPress = async () => {
    setSuccess(null);
    setError(null);
    const picked = await pickFile();
    if (!picked || picked.canceled || !picked.envelope) return;
    setPending(picked.envelope);
    setConfirmOpen(true);
  };

  const runImport = async (password?: string) => {
    if (!pending) return;
    const ok = await doImport(pending, password);
    if (ok) {
      posthog.capture('backup_imported');
      setPwOpen(false);
      setPending(null);
      setSuccess(t('dataBackupV2.importDone'));
    }
  };

  const handleConfirmImport = () => {
    setConfirmOpen(false);
    if (pending?.protected) {
      setPwMode('enter');
      setPwOpen(true);
    } else {
      runImport();
    }
  };

  return (
    <SettingsPageWrapper title={t('dataBackupV2.title')} subtitle={t('dataBackupV2.subtitle')}>
      {/* EXPORT */}
      <SectionLabel>{t('dataBackupV2.exportSection')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="lock-closed-outline"
          iconColor="#6366F1"
          label={t('dataBackupV2.protectLabel')}
          sublabel={t('dataBackupV2.protectSub')}
          right={<SettingsToggle value={protect} onChange={setProtect} />}
          isLast
        />
      </SettingsCard>
      <Text style={helpStyle(v2)}>{t('dataBackupV2.exportHelp')}</Text>
      <View style={{ marginTop: 10 }}>
        <DialogPrimaryBtn
          label={t('dataBackupV2.exportButton')}
          onPress={handleExportPress}
          isLoading={exporting}
        />
      </View>

      {/* IMPORT */}
      <View style={{ height: 26 }} />
      <SectionLabel>{t('dataBackupV2.importSection')}</SectionLabel>
      <View
        style={{
          flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14,
          backgroundColor: v2.warnSoft, marginBottom: 12,
        }}
      >
        <Ionicons name="warning-outline" size={18} color={v2.warn} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontFamily: v2.fontUIRegular, fontSize: 12.5, color: v2.ink, lineHeight: 18 }}>
          {t('dataBackupV2.importWarning')}
        </Text>
      </View>
      <DialogPrimaryBtn
        label={t('dataBackupV2.importButton')}
        onPress={handleImportPress}
        isLoading={importing}
      />

      {/* SUCCESS */}
      {success ? (
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
            padding: 14, borderRadius: 14, backgroundColor: v2.goodSoft,
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color={v2.good} />
          <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, color: v2.ink }}>{success}</Text>
        </View>
      ) : null}

      {/* Erreur hors flux mot de passe (ex: fichier invalide) */}
      {error && !pwOpen && error !== 'WRONG_PASSWORD' ? (
        <Text style={{ marginTop: 14, fontFamily: v2.fontUI, fontSize: 12.5, color: v2.bad }}>
          {errorText}
        </Text>
      ) : null}

      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('dataBackupV2.confirmTitle')}
        message={t('dataBackupV2.confirmMessage')}
        confirmText={t('dataBackupV2.confirmButton')}
        isDestructive
        onClose={() => { setConfirmOpen(false); setPending(null); }}
        onConfirm={handleConfirmImport}
      />

      <BackupPasswordDialog
        isOpen={pwOpen}
        mode={pwMode}
        loading={exporting || importing}
        errorText={error === 'WRONG_PASSWORD' ? t('dataBackupV2.errors.WRONG_PASSWORD') : null}
        onSubmit={(pw) => (pwMode === 'set' ? runExport(pw) : runImport(pw))}
        onClose={() => { setPwOpen(false); setError(null); }}
      />
    </SettingsPageWrapper>
  );
}

function helpStyle(v2: ReturnType<typeof useV2>) {
  return {
    marginTop: 10, marginHorizontal: 4,
    fontFamily: v2.fontUIRegular, fontSize: 12, color: v2.inkSubtle, lineHeight: 17,
  } as const;
}
