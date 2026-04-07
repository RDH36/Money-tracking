import { View } from 'react-native';
import { Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertDialog, AlertDialogBackdrop, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { GhostButton, DangerButton, PrimaryButton } from '@/components/premium';
import { useTranslation } from 'react-i18next';
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
  isOpen, category, transactionCount, onClose, onMoveToOther, onDeleteAll, onDeleteSimple,
}: DeleteCategoryDialogProps) {
  const { t } = useTranslation();

  if (!category) return null;

  const hasTransactions = transactionCount > 0;
  const displayName = getCategoryDisplayName(category.id, category.name, t);

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full items-center justify-center bg-error/10">
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
            </View>
            <RNText className="font-display text-display-md text-content-primary flex-1">
              {t('budget.deleteCategoryConfirm', { name: displayName })}
            </RNText>
          </View>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          {hasTransactions ? (
            <View className="gap-3">
              <RNText className="font-body-regular text-body-md text-content-secondary">
                {t('budget.deleteCategoryHasTransactions', { count: transactionCount })}
              </RNText>
              <View className="gap-2 p-3 rounded-xl bg-bg-raised">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="archive-outline" size={16} color="#8E8EA0" style={{ marginTop: 2 }} />
                  <RNText className="flex-1 text-body-sm font-body-regular text-content-secondary">
                    {t('budget.deleteMoveExplanation')}
                  </RNText>
                </View>
                <View className="flex-row items-start gap-2">
                  <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginTop: 2 }} />
                  <RNText className="flex-1 text-body-sm font-body-regular text-content-secondary">
                    {t('budget.deleteAllExplanation')}
                  </RNText>
                </View>
              </View>
            </View>
          ) : (
            <RNText className="font-body-regular text-body-md text-content-secondary">
              {t('budget.deleteCategoryNoTransactions')}
            </RNText>
          )}
        </AlertDialogBody>
        <AlertDialogFooter>
          <View className="gap-2 w-full">
            {hasTransactions ? (
              <>
                <PrimaryButton label={t('budget.moveToOther')} onPress={onMoveToOther} compact />
                <DangerButton label={t('budget.deleteAlso')} onPress={onDeleteAll} compact />
                <GhostButton label={t('common.cancel')} onPress={onClose} compact />
              </>
            ) : (
              <View className="flex-row gap-2">
                <GhostButton label={t('common.cancel')} onPress={onClose} compact />
                <DangerButton label={t('common.delete')} onPress={onDeleteSimple} compact />
              </View>
            )}
          </View>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
