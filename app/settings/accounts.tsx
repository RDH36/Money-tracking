import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useAccounts } from '@/hooks';
import { AccountsSection } from '@/components/settings';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AddAccountModal } from '@/components/AddAccountModal';
import { EditAccountModal } from '@/components/EditAccountModal';
import { LockedFeatureModal, type LockedFeature } from '@/components/LockedFeatureModal';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';
import type { AccountWithBalance } from '@/types';

export default function AccountsSettingsPage() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const {
    accounts, formatMoney, refresh, deleteAccount, createAccount, updateAccount,
    canCreateAccount, customAccountsCount, maxCustomAccounts,
  } = useAccounts();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountWithBalance | null>(null);
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string; message: string; confirmText: string; onConfirm: () => void;
  } | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleCreateAccount = async (params: Parameters<typeof createAccount>[0]) => {
    const result = await createAccount(params);
    if (result.success) {
      posthog.capture('account_created', { account_type: params.type });
      setShowAddAccount(false);
    }
    return result;
  };

  return (
    <SettingsPageWrapper title={t('settings.accounts')}>
      <AccountsSection
        accounts={accounts}
        formatMoney={formatMoney}
        onAdd={() => {
          if (canCreateAccount) setShowAddAccount(true);
          else setLockedFeature('account');
        }}
        onEdit={(account) => setEditAccount(account)}
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

      <AddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onCreateAccount={handleCreateAccount}
        canCreateAccount={canCreateAccount}
        customAccountsCount={customAccountsCount}
        maxCustomAccounts={maxCustomAccounts}
      />

      <EditAccountModal
        isOpen={!!editAccount}
        account={editAccount}
        onClose={() => setEditAccount(null)}
        onSave={async (id, params) => {
          const ok = await updateAccount(id, params);
          if (ok) posthog.capture('account_updated');
          return ok;
        }}
      />

      <LockedFeatureModal
        feature={lockedFeature}
        onClose={() => setLockedFeature(null)}
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
