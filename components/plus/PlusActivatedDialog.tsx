import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CenterDialog } from '@/components/ui/CenterDialog';
import { DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import type { License } from '@/lib/premium';
import { licenseLine } from './format';

/** E8 : Plus activé, une ligne par fonction débloquée (lot 0 : l'import). */
export function PlusActivatedDialog({ license, onClose }: { license: License | null; onClose: () => void }) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  return (
    <CenterDialog
      isOpen={license !== null}
      onClose={onClose}
      variant="success"
      iconName="checkmark-circle"
      title={t('plus.activated.title')}
      body={license ? licenseLine(license, t, i18n.language) : ''}
      footer={<DialogPrimaryBtn label={t('plus.activated.ok')} onPress={onClose} />}
    >
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="scan-outline" size={16} color={v2.brand} />
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, color: v2.ink }}>
          {t('plus.features.ocrUnlimited')}
        </Text>
      </View>
    </CenterDialog>
  );
}
