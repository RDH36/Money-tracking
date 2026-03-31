import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useAccounts } from '@/hooks';
import { AccountsSection } from '@/components/settings';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AddAccountModal } from '@/components/AddAccountModal';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';

export default function AccountsSettingsPage() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { accounts, formatMoney, refresh, deleteAccount } = useAccounts();
  const [confirmAction, setConfirmAction] = useState<{
    title: string; message: string; confirmText: string; onConfirm: () => void;
  } | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <SettingsPageWrapper title={t('settings.accounts')}>
      <AccountsSection
        accounts={accounts}
        formatMoney={formatMoney}
        onDelete={(account) => setConfirmAction({
          title: t('account.deleteConfirm', { name: account.name }),
          message: t('account.deleteWarning'),
          confirmText: t('common.delete'),
          onConfirm: () => {
            posthog.capture('account_deleted', { account_type: account.type });
            deleteAccount(account.id);
            setConfirmAction(null);
          },
        })}
      />

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || ''}
        isDestructive
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </SettingsPageWrapper>
  );
}
