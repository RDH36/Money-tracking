import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { getCategoryDisplayName } from '@/constants/categories';
import type { ReviewItem } from '@/lib/ocr/import/review';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface OperationRowProps {
  item: ReviewItem;
  category: Category | null;
  counterAccountName: string | null;
  formatMoney: (cents: number) => string;
  locale: string;
  onToggle: () => void;
  onPress: () => void;
}

function shortDate(ymd: string, locale: string): string {
  const d = new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function OperationRow({
  item, category, counterAccountName, formatMoney, locale, onToggle, onPress,
}: OperationRowProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const isCredit = item.direction === 'credit';
  const amountColor = item.kind === 'income' ? v2.good : item.kind === 'transfer' ? v2.inkMuted : v2.ink;

  const badge = item.duplicate
    ? { text: t(`ocrImport.${item.duplicate === 'reference' ? 'dupReference' : item.duplicate === 'similar' ? 'dupSimilar' : 'dupBatch'}`), fg: v2.warn, bg: v2.warnSoft }
    : item.op.uncertain.some((f) => f === 'amount' || f === 'sign' || f === 'date')
      ? { text: t('ocrImport.toCheck'), fg: v2.bad, bg: v2.badSoft }
      : null;

  let tagIcon: IoniconName = 'pricetag-outline';
  let tagText = t('ocrImport.noCategory');
  let tagColor = v2.inkSubtle;
  if (item.kind === 'transfer') {
    tagIcon = 'swap-horizontal';
    tagText = `${t('ocrImport.edit.transfer')} ${isCredit ? '←' : '→'} ${counterAccountName ?? t('ocrImport.noAccount')}`;
  } else if (item.kind === 'income') {
    tagIcon = 'arrow-down-circle-outline';
    tagText = t('ocrImport.edit.income');
    tagColor = v2.good;
  } else if (category) {
    tagIcon = (category.icon as IoniconName) ?? 'pricetag-outline';
    tagText = getCategoryDisplayName(category.id, category.name, t);
    tagColor = category.color ?? v2.brand;
  }

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: v2.bgSurface, borderRadius: 16, borderWidth: 1,
        borderColor: item.selected ? v2.hairlineStrong : v2.hairline,
        paddingVertical: 12, paddingRight: 14, paddingLeft: 4,
        opacity: item.selected ? 1 : 0.6,
      }}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.selected }}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <View
          style={{
            width: 22, height: 22, borderRadius: 7, borderWidth: 1.5,
            borderColor: item.selected ? v2.brand : v2.hairlineStrong,
            backgroundColor: item.selected ? v2.brand : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {item.selected ? <Ionicons name="checkmark" size={15} color={v2.inkOnDark} /> : null}
        </View>
      </Pressable>

      <Pressable onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1,
                textTransform: 'uppercase', color: v2.inkSubtle,
              }}
            >
              {shortDate(item.date, locale)}
            </Text>
            {badge ? (
              <View style={{ backgroundColor: badge.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', color: badge.fg }}>
                  {badge.text}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            numberOfLines={2}
            style={{ marginTop: 3, fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}
          >
            {item.note || item.op.label}
          </Text>
          <View style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name={tagIcon} size={12} color={tagColor} />
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted }}>
              {tagText}
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: amountColor,
            fontVariant: ['tabular-nums'], letterSpacing: -0.2,
          }}
        >
          {`${isCredit ? '+' : '−'}${formatMoney(item.amount)}`}
        </Text>
      </Pressable>
    </View>
  );
}
