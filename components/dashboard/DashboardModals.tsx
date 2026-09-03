import { useTranslation } from 'react-i18next';
import { AddAccountModal } from '@/components/AddAccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LevelUpModal } from '@/components/LevelUpModal';
import { FeatureUnlockedModal } from '@/components/FeatureUnlockedModal';
import { LockedFeatureModal, type LockedFeature } from '@/components/LockedFeatureModal';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

interface Props {
  deleteTarget: TransactionWithCategory | null;
  onCloseDelete: () => void;
  onConfirmDelete: (tx: TransactionWithCategory) => void;
  showAddAccount: boolean;
  onCloseAddAccount: () => void;
  onCreateAccount: React.ComponentProps<typeof AddAccountModal>['onCreateAccount'];
  canCreateAccount: boolean;
  customAccountsCount: number;
  maxCustomAccounts: number;
  levelUp: number | null;
  onCloseLevelUp: () => void;
  unlockKey: string | null;
  onCloseUnlock: () => void;
  lockedFeature: LockedFeature | null;
  onCloseLocked: () => void;
}

/** Les modales du tableau de bord, regroupées pour garder `index.tsx` lisible. */
export function DashboardModals(p: Props) {
  const { t } = useTranslation();
  return (
    <>
      <ConfirmDialog
        isOpen={!!p.deleteTarget} title={t('history.deleteConfirm')}
        message={t('history.deleteMessage')} confirmText={t('common.delete')}
        isDestructive onClose={p.onCloseDelete}
        onConfirm={() => {
          if (p.deleteTarget) p.onConfirmDelete(p.deleteTarget);
          p.onCloseDelete();
        }}
      />
      <AddAccountModal
        isOpen={p.showAddAccount}
        onClose={p.onCloseAddAccount}
        onCreateAccount={p.onCreateAccount}
        canCreateAccount={p.canCreateAccount}
        customAccountsCount={p.customAccountsCount}
        maxCustomAccounts={p.maxCustomAccounts}
      />
      <LevelUpModal level={p.levelUp} onClose={p.onCloseLevelUp} />
      <FeatureUnlockedModal unlockKey={p.unlockKey} onClose={p.onCloseUnlock} />
      <LockedFeatureModal feature={p.lockedFeature} onClose={p.onCloseLocked} />
    </>
  );
}
