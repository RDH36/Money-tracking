import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import { useCategories, SYSTEM_CATEGORY_INCOME_ID } from '@/hooks';
import { formatAmountInput, parseAmount, getNumericValue } from '@/lib/amountInput';
import { TypePill, CategoryChip } from './AddItemFields';
import type { TransactionType } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface AddItemFormProps {
  isLoading: boolean;
  onAddItem: (amount: number, type: TransactionType, categoryId: string | null, note: string | null) => Promise<void>;
}

export function AddItemForm({ isLoading, onAddItem }: AddItemFormProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const currency = useCurrency();
  const { expenseCategories, incomeCategory } = useCategories();

  const [amount, setAmount] = useState('');
  const [itemType, setItemType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const isValid = amount && getNumericValue(amount) > 0;
  const handleSubmit = async () => {
    const numericAmount = getNumericValue(amount);
    if (!numericAmount || numericAmount <= 0) return;
    const finalCategoryId = itemType === 'income' ? SYSTEM_CATEGORY_INCOME_ID : categoryId;
    await onAddItem(parseAmount(amount), itemType, finalCategoryId, note.trim() || null);
    setAmount(''); setItemType('expense'); setCategoryId(null); setNote('');
  };

  return (
    <View
      style={{
        backgroundColor: v2.bgSurface,
        borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 14, padding: 14, gap: 14,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: v2.inkSubtle,
        }}
      >
        {t('planification.addElement')}
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TypePill
          active={itemType === 'expense'}
          icon="arrow-down"
          label={t('add.expense')}
          tone="bad"
          onPress={() => setItemType('expense')}
        />
        <TypePill
          active={itemType === 'income'}
          icon="arrow-up"
          label={t('add.income')}
          tone="good"
          onPress={() => setItemType('income')}
        />
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 4 }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: v2.inkSubtle, marginBottom: 6,
          }}
        >
          {t('planification.amount')} · {currency.code}
        </Text>
        <TextInput
          placeholder="0"
          placeholderTextColor={v2.inkSubtle}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(s) => setAmount(formatAmountInput(s))}
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 38, letterSpacing: -1,
            color: v2.ink, textAlign: 'center',
            fontVariant: ['tabular-nums'],
            minWidth: 200,
          }}
          textAlign="center"
        />
      </View>

      <View>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: v2.inkSubtle, marginBottom: 8,
          }}
        >
          {t('add.category')}
        </Text>
        {itemType === 'expense' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {expenseCategories.slice(0, 8).map((c) => (
              <CategoryChip
                key={c.id}
                category={c}
                active={categoryId === c.id}
                onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: v2.goodSoft,
              borderRadius: 12, padding: 12,
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}
          >
            <View
              style={{
                width: 32, height: 32, borderRadius: 9,
                backgroundColor: v2.good,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name={(incomeCategory?.icon as IoniconName) ?? 'trending-up'} size={16} color="#fff" />
            </View>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.good }}>
              {t('add.income')}
            </Text>
          </View>
        )}
      </View>

      <View>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: v2.inkSubtle, marginBottom: 8,
          }}
        >
          {t('add.noteOptional')}
        </Text>
        <View
          style={{
            backgroundColor: v2.bgRaised, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10,
          }}
        >
          <TextInput
            placeholder={t('add.notePlaceholder')}
            placeholderTextColor={v2.inkSubtle}
            value={note}
            onChangeText={setNote}
            maxLength={20}
            style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.ink, padding: 0 }}
          />
        </View>
        <Text
          style={{
            marginTop: 4, textAlign: 'right',
            fontFamily: v2.fontUI, fontSize: 10,
            color: v2.inkSubtle, fontVariant: ['tabular-nums'],
          }}
        >
          {note.length} / 20
        </Text>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={!isValid || isLoading}
        style={{
          paddingVertical: 14, borderRadius: 12,
          backgroundColor: itemType === 'income' ? v2.good : v2.bgInk,
          alignItems: 'center', justifyContent: 'center',
          opacity: !isValid || isLoading ? 0.5 : 1,
        }}
      >
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
          {t('planification.add')}
        </Text>
      </Pressable>
    </View>
  );
}

