import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface BreakdownCategory {
  id?: string | null;
  name: string;
  amount: number;
  color?: string | null;
  icon?: string | null;
}

export interface BudgetOverlay {
  cumulBudget?: number | null;
  percentage?: number | null;
  status?: 'green' | 'orange' | 'red' | null;
}

interface CategoryBreakdownV2Props {
  categories: BreakdownCategory[];
  totalExpenses: number;
  showAmounts: boolean;
  onToggleAmounts: (next: boolean) => void;
  formatMoney: (n: number) => string;
  getBudgetForCategory?: (id: string, spent: number) => BudgetOverlay | null;
  currencyCode: string;
}

function alpha15(hex: string | null | undefined): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

export function CategoryBreakdownV2({
  categories,
  totalExpenses,
  showAmounts,
  onToggleAmounts,
  formatMoney,
  getBudgetForCategory,
  currencyCode,
}: CategoryBreakdownV2Props) {
  const v2 = useV2();
  const { t } = useTranslation();
  if (categories.length === 0) return null;

  const segments = categories.map((c) => ({
    color: c.color || v2.brand,
    pct: totalExpenses > 0 ? Math.max((c.amount / totalExpenses) * 100, 1) : 0,
  }));

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.5, textTransform: 'uppercase', color: v2.inkSubtle,
          }}
        >
          {t('reports.categoryBreakdown')}
        </Text>
        <View
          style={{
            flexDirection: 'row', backgroundColor: v2.bgRaised,
            borderRadius: 8, overflow: 'hidden',
          }}
        >
          <Toggle v2={v2} active={!showAmounts} label="%" onPress={() => onToggleAmounts(false)} />
          <Toggle v2={v2} active={showAmounts} label={currencyCode} onPress={() => onToggleAmounts(true)} />
        </View>
      </View>

      <View
        style={{
          backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
          borderRadius: 14, padding: 14, gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row', height: 8, borderRadius: 999, overflow: 'hidden',
            backgroundColor: v2.bgRaised,
          }}
        >
          {segments.map((s, i) => (
            <View key={i} style={{ flex: s.pct, backgroundColor: s.color }} />
          ))}
        </View>

        <View style={{ gap: 10 }}>
          {categories.map((cat, i) => (
            <Row
              key={cat.id || i}
              v2={v2}
              cat={cat}
              isLast={i === categories.length - 1}
              totalExpenses={totalExpenses}
              showAmounts={showAmounts}
              currencyCode={currencyCode}
              formatMoney={formatMoney}
              budget={cat.id && getBudgetForCategory ? getBudgetForCategory(cat.id, cat.amount) : null}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

interface RowProps {
  v2: ReturnType<typeof useV2>;
  cat: BreakdownCategory;
  isLast: boolean;
  totalExpenses: number;
  showAmounts: boolean;
  currencyCode: string;
  formatMoney: (n: number) => string;
  budget: BudgetOverlay | null;
}

function Row({ v2, cat, isLast, totalExpenses, showAmounts, currencyCode, formatMoney, budget }: RowProps) {
  const { t } = useTranslation();
  const pct = totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0;
  const color = cat.color || v2.brand;
  const iconName: IoniconName = (cat.icon as IoniconName) ?? 'pricetag-outline';
  const hasBudget = !!budget?.cumulBudget;
  const budgetPct = budget?.percentage ?? 0;
  const budgetTone =
    budget?.status === 'red' ? v2.bad : budget?.status === 'orange' ? v2.warn : v2.good;

  return (
    <View
      style={{
        gap: 6,
        paddingBottom: isLast ? 0 : 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: v2.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: alpha15(color),
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={14} color={color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}
          >
            {cat.name}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}>
            {t('reports.ofExpenses', { pct })}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700',
            color: v2.ink, fontVariant: ['tabular-nums'],
          }}
        >
          {showAmounts
            ? hasBudget
              ? `${formatMoney(cat.amount)} / ${formatMoney(budget!.cumulBudget!)}`
              : `${formatMoney(cat.amount)} ${currencyCode}`
            : `${pct}%`}
        </Text>
      </View>
      {hasBudget ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 38 }}>
          <View style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: v2.bgRaised, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${Math.min(budgetPct, 100)}%`, backgroundColor: budgetTone, borderRadius: 999 }} />
          </View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: budgetTone, fontVariant: ['tabular-nums'] }}>
            {budgetPct}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

interface ToggleProps { v2: ReturnType<typeof useV2>; active: boolean; label: string; onPress: () => void; }
function Toggle({ v2, active, label, onPress }: ToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 4, paddingHorizontal: 12,
        backgroundColor: active ? v2.bgInk : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600',
          color: active ? v2.inkOnDark : v2.inkSubtle,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
