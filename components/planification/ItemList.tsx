import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import type { PlanificationItemWithCategory } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
const DEFAULT_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

interface ItemListProps {
  items: PlanificationItemWithCategory[];
  isPending: boolean;
  linkedTransactions: TransactionWithCategory[];
  formatMoney: (amount: number) => string;
  onDeleteItem: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
}

function getCategoryName(
  categoryId: string | null,
  categoryName: string | null,
  t: (k: string, p?: any) => string,
): string {
  if (!categoryId) return t('common.noCategory');
  if (categoryId === 'system-income') return t('add.income');
  if (DEFAULT_CATEGORY_IDS.includes(categoryId)) return t(`categories.${categoryId}`);
  return categoryName || t('common.noCategory');
}

interface DisplayableItem {
  id: string;
  type: string;
  amount: number;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  note: string | null;
}

function alpha15(hex: string | null | undefined): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

interface ItemRowProps {
  item: DisplayableItem;
  formatMoney: (n: number) => string;
  onDelete: () => void;
  isLast: boolean;
}

function ItemRow({ item, formatMoney, onDelete, isLast }: ItemRowProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const isIncome = item.type === 'income';
  const tone = isIncome ? v2.good : v2.bad;
  const sign = isIncome ? '+' : '−';
  const color = item.category_color ?? v2.inkMuted;
  const iconName: IoniconName = (item.category_icon as IoniconName) ?? 'pricetag-outline';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: v2.hairline,
      }}
    >
      <View
        style={{
          width: 34, height: 34, borderRadius: 9,
          backgroundColor: alpha15(color),
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={15} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}
        >
          {getCategoryName(item.category_id, item.category_name, t)}
        </Text>
        {item.note ? (
          <Text
            numberOfLines={1}
            style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}
          >
            {item.note}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
          color: tone, fontVariant: ['tabular-nums'],
        }}
      >
        {sign}{formatMoney(item.amount)}
      </Text>
      <Pressable
        onPress={onDelete}
        hitSlop={6}
        style={{
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: v2.badSoft,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="trash-outline" size={14} color={v2.bad} />
      </Pressable>
    </View>
  );
}

export function ItemList({
  items,
  isPending,
  linkedTransactions,
  formatMoney,
  onDeleteItem,
  onDeleteTransaction,
}: ItemListProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  if (!isPending && linkedTransactions.length === 0) return null;

  if (!isPending && linkedTransactions.length > 0) {
    return (
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: v2.inkSubtle, paddingHorizontal: 4,
          }}
        >
          {t('planification.linkedTransactions')} · {linkedTransactions.length}
        </Text>
        <View
          style={{
            backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
            borderRadius: 14, padding: 4,
          }}
        >
          {linkedTransactions.map((tx, i) => (
            <ItemRow
              key={tx.id}
              item={tx}
              formatMoney={formatMoney}
              onDelete={() => onDeleteTransaction(tx.id)}
              isLast={i === linkedTransactions.length - 1}
            />
          ))}
        </View>
      </View>
    );
  }

  if (isPending && items.length === 0) {
    return (
      <View
        style={{
          backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
          borderRadius: 14, paddingVertical: 30, alignItems: 'center',
        }}
      >
        <Ionicons name="list-outline" size={28} color={v2.inkSubtle} />
        <Text
          style={{
            marginTop: 8, fontFamily: v2.fontUI, fontSize: 12,
            color: v2.inkSubtle, fontStyle: 'italic',
          }}
        >
          {t('planification.addElementsHint')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: v2.inkSubtle, paddingHorizontal: 4,
        }}
      >
        {t('planification.elements', { count: items.length })}
      </Text>
      <View
        style={{
          backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
          borderRadius: 14, padding: 4,
        }}
      >
        {items.map((item, i) => (
          <ItemRow
            key={item.id}
            item={item}
            formatMoney={formatMoney}
            onDelete={() => onDeleteItem(item.id)}
            isLast={i === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
