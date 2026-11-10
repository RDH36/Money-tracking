import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import { readSmsText } from '@/lib/ocr/sms';

interface PasteSmsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Texte qui contient au moins une opération reconnue. */
  onRead: (text: string) => void;
}

/**
 * « Coller un SMS » : un ou plusieurs SMS de Mobile Money collés d'un coup.
 * Le texte est vérifié ici : rien de reconnu → message, aucune lecture comptée.
 */
export function PasteSmsSheet({ isOpen, onClose, onRead }: PasteSmsSheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const posthog = usePostHog();
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setError(false);
    }
  }, [isOpen]);

  const submit = () => {
    const reading = readSmsText(text);
    posthog.capture('import_sms_pasted', { sms_count: reading.messages, recognized: reading.recognized });
    if (reading.operations.length === 0) {
      setError(true);
      return;
    }
    onRead(text);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      overline={t('ocrImport.sms.overline')}
      title={t('ocrImport.sms.title')}
      maxHeightPct={90}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('ocrImport.sms.cancel')} onPress={onClose} />
          <DialogPrimaryBtn label={t('ocrImport.sms.read')} onPress={submit} disabled={text.trim() === ''} />
        </DialogButtonRow>
      }
    >
      <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 13, color: v2.inkMuted, marginBottom: 10 }}>
        {t('ocrImport.sms.hint')}
      </Text>
      <TextInput
        value={text}
        onChangeText={(s) => {
          setText(s);
          setError(false);
        }}
        multiline
        textAlignVertical="top"
        placeholder={t('ocrImport.sms.placeholder')}
        placeholderTextColor={v2.inkMuted}
        accessibilityLabel={t('ocrImport.sms.title')}
        style={{
          minHeight: 140, maxHeight: 260, borderRadius: 12, borderWidth: 1,
          borderColor: error ? v2.bad : v2.hairlineStrong, backgroundColor: v2.bgBase,
          padding: 12, fontFamily: v2.fontUIRegular, fontSize: 14, color: v2.ink,
        }}
      />
      {error ? (
        <Text style={{ marginTop: 8, fontFamily: v2.fontUI, fontSize: 12, color: v2.bad }}>
          {t('ocrImport.sms.nothing')}
        </Text>
      ) : null}
    </BottomSheet>
  );
}
