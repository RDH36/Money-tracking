import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';

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
  isOpen,
  title,
  message,
  confirmText,
  isDestructive = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Heading size="md" className="text-typography-900">{title}</Heading>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <Text className="text-typography-700">{message}</Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={onClose}>
            <ButtonText>Annuler</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: isDestructive ? '#DC2626' : theme.colors.primary }}
            onPress={onConfirm}
          >
            <ButtonText className="text-white">{confirmText}</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
