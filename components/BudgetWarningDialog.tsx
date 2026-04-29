import { useTranslation } from 'react-i18next';
import { CenterDialog } from '@/components/ui/CenterDialog';
import {
  DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn, DialogDangerBtn,
} from '@/components/ui/DialogButtons';

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
    <CenterDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isExceeded
        ? t('budget.exceededTitle', { category: categoryName })
        : t('budget.warningTitle', { category: categoryName, percent: percentage })}
      body={isExceeded
        ? t('budget.exceededMessage', { spent, limit, over: overAmount })
        : t('budget.warningMessage', { spent, limit })}
      iconName={isExceeded ? 'alert-circle-outline' : 'warning-outline'}
      variant={isExceeded ? 'danger' : 'warning'}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('common.cancel')} onPress={onClose} />
          {isExceeded ? (
            <DialogDangerBtn label={t('budget.continueAnyway')} onPress={onContinue} />
          ) : (
            <DialogPrimaryBtn label={t('budget.continueAnyway')} onPress={onContinue} />
          )}
        </DialogButtonRow>
      }
    />
  );
}
