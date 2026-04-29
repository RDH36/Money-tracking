import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CenterDialog } from '@/components/ui/CenterDialog';
import {
  DialogButtonRow, DialogButtonStack, DialogGhostBtn,
  DialogPrimaryBtn, DialogDangerBtn,
} from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import { getCategoryDisplayName } from '@/constants/categories';
import type { Category } from '@/types';

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  category: Category | null;
  transactionCount: number;
  onClose: () => void;
  onMoveToOther: () => void;
  onDeleteAll: () => void;
  onDeleteSimple: () => void;
}

export function DeleteCategoryDialog({
  isOpen, category, transactionCount, onClose,
  onMoveToOther, onDeleteAll, onDeleteSimple,
}: DeleteCategoryDialogProps) {
  const { t } = useTranslation();
  const v2 = useV2();

  if (!category) {
    return (
      <CenterDialog isOpen={false} onClose={onClose} title="" showClose={false} />
    );
  }

  const hasTransactions = transactionCount > 0;
  const displayName = getCategoryDisplayName(category.id, category.name, t);

  const body = hasTransactions ? (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 13,
          color: v2.inkMuted, lineHeight: 19,
        }}
      >
        {t('budget.deleteCategoryHasTransactions', { count: transactionCount })}
      </Text>
      <View style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: v2.bgRaised }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Ionicons
            name="archive-outline" size={14} color={v2.inkSubtle}
            style={{ marginTop: 2 }}
          />
          <Text
            style={{
              flex: 1, fontFamily: v2.fontUI, fontSize: 12,
              color: v2.inkMuted, lineHeight: 17,
            }}
          >
            {t('budget.deleteMoveExplanation')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Ionicons
            name="trash-outline" size={14} color={v2.bad}
            style={{ marginTop: 2 }}
          />
          <Text
            style={{
              flex: 1, fontFamily: v2.fontUI, fontSize: 12,
              color: v2.inkMuted, lineHeight: 17,
            }}
          >
            {t('budget.deleteAllExplanation')}
          </Text>
        </View>
      </View>
    </View>
  ) : (
    <Text
      style={{
        fontFamily: v2.fontUI, fontSize: 13,
        color: v2.inkMuted, lineHeight: 19,
      }}
    >
      {t('budget.deleteCategoryNoTransactions')}
    </Text>
  );

  return (
    <CenterDialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('budget.deleteCategoryConfirm', { name: displayName })}
      iconName="alert-circle-outline"
      variant="danger"
      footer={
        hasTransactions ? (
          <DialogButtonStack>
            <DialogPrimaryBtn label={t('budget.moveToOther')} onPress={onMoveToOther} />
            <DialogDangerBtn label={t('budget.deleteAlso')} onPress={onDeleteAll} />
            <DialogGhostBtn label={t('common.cancel')} onPress={onClose} />
          </DialogButtonStack>
        ) : (
          <DialogButtonRow>
            <DialogGhostBtn label={t('common.cancel')} onPress={onClose} />
            <DialogDangerBtn label={t('common.delete')} onPress={onDeleteSimple} />
          </DialogButtonRow>
        )
      }
    >
      {body}
    </CenterDialog>
  );
}
