import { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';

interface BackupPasswordDialogProps {
  isOpen: boolean;
  /** 'set' = définir un mot de passe (export), 'enter' = le saisir (import). */
  mode: 'set' | 'enter';
  loading?: boolean;
  errorText?: string | null;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

const MIN_LENGTH = 4;

export function BackupPasswordDialog({
  isOpen, mode, loading, errorText, onSubmit, onClose,
}: BackupPasswordDialogProps) {
  const { t } = useTranslation();
  const v2 = useV2();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirm('');
      setLocalError(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (password.length < MIN_LENGTH) {
      setLocalError(t('dataBackupV2.passwordTooShort', { count: MIN_LENGTH }));
      return;
    }
    if (mode === 'set' && password !== confirm) {
      setLocalError(t('dataBackupV2.passwordMismatch'));
      return;
    }
    setLocalError(null);
    onSubmit(password);
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: v2.hairlineStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: v2.fontUIRegular,
    fontSize: 15,
    color: v2.ink,
    backgroundColor: v2.bgBase,
  } as const;

  const shownError = localError || errorText;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t(mode === 'set' ? 'dataBackupV2.setPasswordTitle' : 'dataBackupV2.enterPasswordTitle')}
      overline={t('dataBackupV2.overline')}
      scrollable={false}
      footer={
        <DialogPrimaryBtn
          label={t(mode === 'set' ? 'dataBackupV2.protectAndExport' : 'dataBackupV2.decryptAndImport')}
          onPress={handleSubmit}
          isLoading={loading}
        />
      }
    >
      <View style={{ gap: 12 }}>
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 13, color: v2.inkMuted, lineHeight: 19 }}>
          {t(mode === 'set' ? 'dataBackupV2.setPasswordBody' : 'dataBackupV2.enterPasswordBody')}
        </Text>

        <TextInput
          style={inputStyle}
          placeholder={t('dataBackupV2.passwordPlaceholder')}
          placeholderTextColor={v2.inkSubtle}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        {mode === 'set' ? (
          <TextInput
            style={inputStyle}
            placeholder={t('dataBackupV2.confirmPlaceholder')}
            placeholderTextColor={v2.inkSubtle}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirm}
            onChangeText={setConfirm}
            editable={!loading}
          />
        ) : null}

        {shownError ? (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.bad }}>{shownError}</Text>
        ) : null}

        {mode === 'set' ? (
          <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 11, color: v2.inkSubtle, lineHeight: 16 }}>
            {t('dataBackupV2.passwordWarning')}
          </Text>
        ) : null}
      </View>
    </BottomSheet>
  );
}
