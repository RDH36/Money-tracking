import { View } from 'react-native';
import { Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertDialog, AlertDialogBackdrop, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { GhostButton, PrimaryButton, DangerButton } from '@/components/premium';
import { useTranslation } from 'react-i18next';

interface BudgetWarningDialogProps {
  isOpen: boolean;
  categoryName: string;
  spent: string;
  limit: string;
  percentage: number;
  overAmount?: string;
  onClose: () => void;
  onContinue: () => void;
}

export function BudgetWarningDialog({
  isOpen, categoryName, spent, limit, percentage, overAmount, onClose, onContinue,
}: BudgetWarningDialogProps) {
  const { t } = useTranslation();
  const isExceeded = percentage >= 100;

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: isExceeded ? '#EF444420' : '#F59E0B20' }}>
              <Ionicons name={isExceeded ? 'alert-circle' : 'warning'} size={24}
                color={isExceeded ? '#EF4444' : '#F59E0B'} />
            </View>
            <RNText className="font-display text-display-md text-content-primary flex-1">
              {isExceeded
                ? t('budget.exceededTitle', { category: categoryName })
                : t('budget.warningTitle', { category: categoryName, percent: percentage })}
            </RNText>
          </View>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <RNText className="font-body-regular text-body-md text-content-secondary">
            {isExceeded
              ? t('budget.exceededMessage', { spent, limit, over: overAmount })
              : t('budget.warningMessage', { spent, limit })}
          </RNText>
        </AlertDialogBody>
        <AlertDialogFooter>
          <GhostButton label={t('common.cancel')} onPress={onClose} compact />
          {isExceeded ? (
            <DangerButton label={t('budget.continueAnyway')} onPress={onContinue} compact />
          ) : (
            <PrimaryButton label={t('budget.continueAnyway')} onPress={onContinue} compact />
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
