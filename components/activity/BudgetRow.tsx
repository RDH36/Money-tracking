import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';
import { Progress } from '@/components/dashboard';
import type { ActivityBudgetItem } from './BudgetByCategoryCard';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface BudgetRowProps {
  budget: ActivityBudgetItem;
  isLast: boolean;
  formatMoney: (n: number) => string;
  onPress?: () => void;
}

function alpha(hex: string | null, suffix: string): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + suffix;
  return 'rgba(15,19,17,0.06)';
}

export function BudgetRow({ budget, isLast, formatMoney, onPress }: BudgetRowProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const hasLimit = budget.limit > 0;
  const pct = hasLimit ? Math.round((budget.spent / budget.limit) * 100) : 0;
  const over = pct > 100;
  const near = pct >= 80 && pct <= 100;
  const tone = !hasLimit ? v2.inkMuted : over ? v2.bad : near ? v2.warn : v2.ink;
  const color = budget.color ?? v2.brand;
  const iconName: IoniconName = (budget.icon as IoniconName) ?? 'pricetag-outline';
  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: v2.hairline,
      }}
    >
      <RowHeader v2={v2} budget={budget} color={color} iconName={iconName} tone={tone} formatMoney={formatMoney} hasLimit={hasLimit} />
      {hasLimit ? (
        <>
          <Progress value={Math.min(pct, 100)} height={5} color={tone} thresholds={[50, 80]} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 10, color: v2.inkSubtle, fontWeight: '500' }}>
              {t('dashboard.thresholds')}
            </Text>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: tone, fontVariant: ['tabular-nums'] }}>
              {pct}%
            </Text>
          </View>
        </>
      ) : (
        <Text style={{
          fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle,
          fontStyle: 'italic', marginTop: 2,
        }}>
          {t('activity.noLimitSet')}
        </Text>
      )}
    </Wrapper>
  );
}

interface RowHeaderProps {
  v2: V2Tokens;
  budget: ActivityBudgetItem;
  color: string;
  iconName: IoniconName;
  tone: string;
  formatMoney: (n: number) => string;
  hasLimit: boolean;
}

function RowHeader({ v2, budget, color, iconName, tone, formatMoney, hasLimit }: RowHeaderProps) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <View
        style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: alpha(color, '15'),
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={15} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink, flexShrink: 1 }}
          >
            {budget.name}
          </Text>
          {budget.alert ? (
            <View style={{ backgroundColor: v2.warnSoft, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 999 }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 9, fontWeight: '700', color: v2.warn }}>
                {t('activity.thresholdAlert')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}>
          {t('activity.txCount', { count: budget.txCount })}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: tone, fontVariant: ['tabular-nums'] }}>
          {formatMoney(budget.spent)}
        </Text>
        {hasLimit ? (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 10, color: v2.inkSubtle, fontVariant: ['tabular-nums'] }}>
            {t('activity.outOfLimit', { limit: formatMoney(budget.limit) })}
          </Text>
        ) : (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 10, color: v2.inkSubtle, fontStyle: 'italic' }}>
            {t('activity.unlimited')}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={14} color={v2.inkSubtle} style={{ marginLeft: 6 }} />
    </View>
  );
}
