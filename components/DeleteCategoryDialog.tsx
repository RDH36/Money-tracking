import { View } from 'react-native';
import { Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertDialog, AlertDialogBackdrop, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { GhostButton, DangerButton, PrimaryButton } from '@/components/premium';
import { useTranslation } from 'react-i18next';
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
              {t('budget.deleteCategoryConfirm', { name: category.name })}
            </RNText>
          </View>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <RNText className="font-body-regular text-body-md text-content-secondary">
            {hasTransactions
              ? t('budget.deleteCategoryHasTransactions', { count: transactionCount })
              : t('budget.deleteCategoryNoTransactions')}
          </RNText>
        </AlertDialogBody>
        <AlertDialogFooter>
          <View className="gap-2 w-full">
            {hasTransactions ? (
              <>
                <PrimaryButton label={`📦 ${t('budget.moveToOther')}`} onPress={onMoveToOther} compact />
                <DangerButton label={`🗑️ ${t('budget.deleteAlso')}`} onPress={onDeleteAll} compact />
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
