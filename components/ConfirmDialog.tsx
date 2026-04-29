import { useTranslation } from 'react-i18next';
import { CenterDialog } from '@/components/ui/CenterDialog';
import {
  DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn, DialogDangerBtn,
} from '@/components/ui/DialogButtons';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  isDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  isOpen, title, message, confirmText, isDestructive = false, onClose, onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <CenterDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      body={message}
      iconName={isDestructive ? 'alert-circle-outline' : undefined}
      variant={isDestructive ? 'danger' : 'neutral'}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('common.cancel')} onPress={onClose} />
          {isDestructive ? (
            <DialogDangerBtn label={confirmText} onPress={onConfirm} />
          ) : (
            <DialogPrimaryBtn label={confirmText} onPress={onConfirm} />
          )}
        </DialogButtonRow>
      }
    />
  );
}
