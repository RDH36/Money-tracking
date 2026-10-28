import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { AccountPickerV2, DateField, NoteField } from '@/components/add';
import { useV2 } from '@/constants/designTokensV2';
import { formatAmountInput, parseAmount } from '@/lib/amountInput';
import { toYmd } from '@/lib/ocr/text';
import type { ReviewItem } from '@/lib/ocr/import/review';
import type { OperationKind } from '@/lib/ocr';
import type { AccountWithBalance, Category } from '@/types';
import { KindSegment } from './KindSegment';
import { CategoryChips } from './CategoryChips';
import { AmountField, FieldBlock } from './FieldBlock';

interface EditOperationSheetProps {
  item: ReviewItem | null;
  onClose: () => void;
  onApply: (key: string, patch: Partial<ReviewItem>) => void;
  accounts: AccountWithBalance[];
  categories: Category[];
  currencySymbol: string;
  currencyLocale: string;
  formatMoney: (cents: number) => string;
  getAccountName: (a: AccountWithBalance) => string;
}

function ymdToDate(ymd: string): Date {
  return new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10), 12);
}

export function EditOperationSheet({
  item, onClose, onApply, accounts, categories, currencySymbol, currencyLocale, formatMoney, getAccountName,
}: EditOperationSheetProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const [kind, setKind] = useState<OperationKind>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [counterId, setCounterId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  // Dernière opération ouverte : garde le contenu visible pendant la fermeture.
  const [current, setCurrent] = useState<ReviewItem | null>(null);

  // Recharge le formulaire à chaque ouverture sur une autre opération.
  useEffect(() => {
    if (!item) return;
    setCurrent(item);
    setKind(item.kind);
    setAmount(formatAmountInput((item.amount / 100).toFixed(2)));
    setDate(ymdToDate(item.date));
    setCategoryId(item.categoryId);
    setAccountId(item.accountId);
    setCounterId(item.counterAccountId);
    setNote(item.note);
  }, [item]);

  if (!current) return null;

  const direction = kind === 'income' ? 'credit' : kind === 'expense' ? 'debit' : current.direction;
  const cents = parseAmount(amount);
  const isTransfer = kind === 'transfer';
  const canApply = cents > 0 && !!accountId && (!isTransfer || (!!counterId && counterId !== accountId));

  const apply = () => {
    onApply(current.key, {
      kind, direction, amount: cents, date: toYmd(date), note,
      categoryId: kind === 'expense' ? categoryId : null,
      accountId,
      counterAccountId: isTransfer ? counterId : null,
    });
    onClose();
  };

  const [mainLabel, counterLabel] = !isTransfer
    ? [t('ocrImport.edit.account'), '']
    : direction === 'debit'
      ? [t('ocrImport.edit.from'), t('ocrImport.edit.to')]
      : [t('ocrImport.edit.to'), t('ocrImport.edit.from')];

  return (
    <BottomSheet
      isOpen={!!item}
      onClose={onClose}
      title={t('ocrImport.edit.title')}
      maxHeightPct={88}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('ocrImport.edit.cancel')} onPress={onClose} />
          <DialogPrimaryBtn label={t('ocrImport.edit.apply')} onPress={apply} disabled={!canApply} />
        </DialogButtonRow>
      }
    >
      <View style={{ backgroundColor: v2.bgRaised, borderRadius: 12, padding: 12 }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: v2.inkSubtle }}>
          {t('ocrImport.edit.bankLabel')}
        </Text>
        <Text style={{ marginTop: 4, fontFamily: v2.fontUIRegular, fontSize: 12, color: v2.inkMuted }}>
          {current.op.label}{current.op.reference ? `\n${current.op.reference}` : ''}
        </Text>
      </View>

      <FieldBlock label={t('ocrImport.edit.type')}>
        <KindSegment value={kind} onChange={setKind} />
      </FieldBlock>

      <FieldBlock label={t('ocrImport.edit.amount')}>
        <AmountField value={amount} onChangeText={setAmount} currencySymbol={currencySymbol} locale={currencyLocale} />
      </FieldBlock>

      <DateField
        date={date}
        onChange={setDate}
        label={t('ocrImport.edit.date')}
        todayLabel={t('add.today')}
        yesterdayLabel={t('add.yesterday')}
        locale={i18n.language}
      />

      {kind === 'expense' ? (
        <FieldBlock label={t('ocrImport.edit.category')}>
          <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
        </FieldBlock>
      ) : null}

      <AccountPickerV2
        accounts={accounts} selectedId={accountId} onSelect={setAccountId}
        formatMoney={formatMoney} label={mainLabel} getAccountName={getAccountName}
      />
      {isTransfer ? (
        <AccountPickerV2
          accounts={accounts.filter((a) => a.id !== accountId)} selectedId={counterId} onSelect={setCounterId}
          formatMoney={formatMoney} label={counterLabel} getAccountName={getAccountName}
        />
      ) : null}

      <NoteField value={note} onChangeText={setNote} placeholder={t('add.notePlaceholder')} label={t('ocrImport.edit.note')} maxLength={100} />
    </BottomSheet>
  );
}
