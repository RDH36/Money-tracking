import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CenterDialog } from '@/components/ui/CenterDialog';
import { DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';

interface LevelUpModalProps {
  level: number | null;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const { t } = useTranslation();
  const v2 = useV2();

  return (
    <CenterDialog
      isOpen={level !== null}
      onClose={onClose}
      title={t('gamification.levelUp', { level: level ?? 1 })}
      variant="celebration"
      showClose={false}
      maxWidth={380}
    >
      <View style={{ alignItems: 'center', marginTop: -8 }}>
        <Text style={{ fontSize: 56, marginBottom: 6 }}>🎉</Text>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13,
            color: v2.inkMuted, textAlign: 'center', lineHeight: 19,
            marginBottom: 16,
          }}
        >
          {t('gamification.levelUpMessage')}
        </Text>
        <View style={{ width: '100%' }}>
          <DialogPrimaryBtn label={t('gamification.continue')} onPress={onClose} />
        </View>
      </View>
    </CenterDialog>
  );
}
