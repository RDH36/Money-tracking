import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { AccountPickerV2, DateField, NoteField } from '@/components/add';
import { AmountField, FieldBlock } from '@/components/forms/FieldBlock';
import { CategoryChips } from '@/components/forms/CategoryChips';
import { useV2 } from '@/constants/designTokensV2';
import { useAccounts, useCategories } from '@/hooks';
import { useSQLiteContext } from '@/lib/database';
import { updateTransaction } from '@/lib/database/updateTransaction';
import { formatCurrency } from '@/lib/currency';
import { formatAmountInput, parseAmount } from '@/lib/amountInput';
import { useCurrency } from '@/stores/settingsStore';
import { useTransactionEditStore } from '@/stores/transactionEditStore';
import type { AccountWithBalance } from '@/types';

/** Garde l'heure d'origine : seule la date de l'opération change. */
function withOriginalTime(day: Date, originalIso: string): string {
  const original = new Date(originalIso);
  const d = new Date(day);
  d.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), original.getMilliseconds());
  return d.toISOString();
}

/**
 * Feuille de modification d'une transaction (historique, accueil). Montée une
 * fois à la racine, pilotée par `useTransactionEditStore`. Un transfert est
 * modifié d'un bloc : même montant, date et note sur ses deux jambes.
 */
export function EditTransactionSheet() {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const db = useSQLiteContext();
  const currency = useCurrency();
  const { target, close } = useTransactionEditStore();
  const { accounts } = useAccounts();
  const { expenseCategories, refresh: refreshCategories } = useCategories();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Dernière transaction ouverte : garde le contenu visible pendant la fermeture.
  const [current, setCurrent] = useState(target);

  // Recharge le formulaire à chaque ouverture ; un transfert lit sa jambe crédit.
  useEffect(() => {
    if (!target) return;
    setCurrent(target);
    refreshCategories();
    setAmount(formatAmountInput((target.amount / 100).toFixed(2)));
    setDate(new Date(target.transaction_date || target.created_at));
    setCategoryId(target.category_id);
    setAccountId(target.account_id);
    setNote(target.note ?? '');
    setError(null);
    setToAccountId(null);
    if (target.transfer_id) {
      db.getFirstAsync<{ account_id: string }>(
        `SELECT account_id FROM transactions WHERE transfer_id = ? AND id != ? AND deleted_at IS NULL`,
        [target.transfer_id, target.id]
      ).then((row) => {
        // Sens du transfert : « Depuis » = jambe dépense, « Vers » = jambe revenu.
        if (target.type === 'income') {
          setAccountId(row?.account_id ?? null);
          setToAccountId(target.account_id);
        } else setToAccountId(row?.account_id ?? null);
      });
    }
  }, [target, db, refreshCategories]);

  if (!current) return null;

  const isTransfer = !!current.transfer_id;
  const cents = parseAmount(amount);
  const canSave = cents > 0 && !!accountId && (!isTransfer || (!!toAccountId && toAccountId !== accountId)) && !saving;
  const formatMoney = (c: number) => formatCurrency(c, currency.code);
  const getAccountName = (a: AccountWithBalance): string =>
    a.is_default === 1 ? (a.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash')) : a.name;

  const save = async () => {
    if (!canSave || !accountId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateTransaction(db, current, {
        amount: cents,
        transactionDate: withOriginalTime(date, current.transaction_date || current.created_at),
        note: note.trim() || null,
        categoryId: current.type === 'expense' && !isTransfer ? categoryId : null,
        accountId,
        toAccountId,
      });
      if (res.ok) close();
      else setError(t(res.error));
    } catch (err) {
      console.error('Updating transaction failed:', err);
      setError(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={!!target}
      onClose={close}
      title={t(isTransfer ? 'editTx.titleTransfer' : 'editTx.title')}
      maxHeightPct={88}
      footer={
        <>
          {error ? (
            <Text style={{ marginBottom: 8, fontFamily: v2.fontUI, fontSize: 12, color: v2.bad, textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}
          <DialogButtonRow>
            <DialogGhostBtn label={t('common.cancel')} onPress={close} />
            <DialogPrimaryBtn label={t('common.save')} onPress={save} disabled={!canSave} isLoading={saving} />
          </DialogButtonRow>
        </>
      }
    >
      {isTransfer ? (
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 12, lineHeight: 17, color: v2.inkMuted }}>
          {t('editTx.transferHint')}
        </Text>
      ) : null}

      <FieldBlock label={t('editTx.amount')}>
        <AmountField value={amount} onChangeText={setAmount} currencySymbol={currency.symbol} locale={currency.locale} />
      </FieldBlock>

      <DateField
        date={date}
        onChange={setDate}
        label={t('editTx.date')}
        todayLabel={t('add.today')}
        yesterdayLabel={t('add.yesterday')}
        locale={i18n.language}
      />

      {current.type === 'expense' && !isTransfer ? (
        <FieldBlock label={t('editTx.category')}>
          <CategoryChips categories={expenseCategories} selectedId={categoryId} onSelect={setCategoryId} />
        </FieldBlock>
      ) : null}

      <AccountPickerV2
        accounts={accounts} selectedId={accountId} onSelect={setAccountId} formatMoney={formatMoney}
        label={t(isTransfer ? 'editTx.from' : 'editTx.account')} getAccountName={getAccountName}
      />
      {isTransfer ? (
        <AccountPickerV2
          accounts={accounts.filter((a) => a.id !== accountId)} selectedId={toAccountId} onSelect={setToAccountId}
          formatMoney={formatMoney} label={t('editTx.to')} getAccountName={getAccountName}
        />
      ) : null}

      <NoteField value={note} onChangeText={setNote} placeholder={t('add.notePlaceholder')} label={t('editTx.note')} maxLength={100} />
    </BottomSheet>
  );
}
