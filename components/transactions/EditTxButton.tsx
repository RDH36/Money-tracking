import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useTransactionEditStore } from '@/stores/transactionEditStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

/**
 * Bouton « Modifier » visible d'une ligne de transaction : ouvre la feuille de
 * modification montée à la racine. 28 px + hitSlop 8 = zone tactile de 44 px.
 */
export function EditTxButton({ tx, label }: { tx: TransactionWithCategory; label: string }) {
  const v2 = useV2();
  const { t } = useTranslation();
  const open = useTransactionEditStore((s) => s.open);
  return (
    <Pressable
      onPress={() => open(tx)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('editTx.a11y', { label })}
      style={{
        width: 28, height: 28, borderRadius: 14, backgroundColor: v2.bgRaised,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Ionicons name="pencil" size={13} color={v2.ink} />
    </Pressable>
  );
}
