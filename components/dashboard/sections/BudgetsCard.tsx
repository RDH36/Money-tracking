import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import { Progress } from '../Progress';
import { SectionHead } from '../SectionHead';
import type { BudgetData } from '@/hooks/useBudgets';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface BudgetsCardProps {
  monthLabel: string;
  budgets: BudgetData[];
  onSeeAllPress: () => void;
}

function alpha15(hex: string): string {
  if (hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

export function BudgetsCard({ monthLabel, budgets, onSeeAllPress }: BudgetsCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const visible = budgets.filter((b) => b.budgetLimit && b.budgetLimit > 0).slice(0, 3);

  return (
    <View>
      <SectionHead
        overline={monthLabel}
        title={t('dashboard.budgets')}
        action={
          <Pressable
            onPress={onSeeAllPress}
            hitSlop={6}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text
              style={{
                fontFamily: v2.fontUI,
                fontSize: 12,
                fontWeight: '600',
                color: v2.brand,
              }}
            >
              {t('dashboard.viewAll')}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={v2.brand} />
          </Pressable>
        }
      />

      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 18,
          padding: 14,
        }}
      >
        {visible.length === 0 ? (
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 12,
              color: v2.inkSubtle,
              textAlign: 'center',
              paddingVertical: 12,
            }}
          >
            {t('dashboard.noBudgets')}
          </Text>
        ) : (
          visible.map((b, i) => {
            const limit = b.budgetLimit ?? 0;
            const pct = limit ? Math.round((b.spent / limit) * 100) : 0;
            const over = pct > 100;
            const near = pct >= 80 && pct <= 100;
            const tone = over ? v2.bad : near ? v2.warn : v2.good;
            const isLast = i === visible.length - 1;
            const categoryColor = b.category.color ?? v2.brand;
            const iconName: IoniconName = (b.category.icon as IoniconName) ?? 'pricetag-outline';

            return (
              <View
                key={b.category.id}
                style={{
                  paddingTop: i === 0 ? 0 : 12,
                  paddingBottom: isLast ? 0 : 12,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: v2.hairline,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: alpha15(categoryColor),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={iconName} size={14} color={categoryColor} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: v2.fontUI,
                      fontSize: 13,
                      fontWeight: '600',
                      color: v2.ink,
                      flex: 1,
                    }}
                  >
                    {b.category.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: v2.fontUI,
                        fontVariant: ['tabular-nums'],
                        fontSize: 13,
                        fontWeight: '700',
                        color: tone,
                      }}
                    >
                      {formatMoneyFr(b.spent)}
                    </Text>
                    <Text
                      style={{
                        fontFamily: v2.fontUI,
                        fontVariant: ['tabular-nums'],
                        fontSize: 11,
                        color: v2.inkSubtle,
                      }}
                    >
                      / {formatMoneyFr(limit)}
                    </Text>
                  </View>
                </View>

                <Progress
                  value={Math.min(pct, 100)}
                  height={6}
                  color={tone}
                  thresholds={[50, 80]}
                />

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: v2.fontUI,
                      fontSize: 10,
                      color: v2.inkSubtle,
                      fontWeight: '500',
                    }}
                  >
                    {t('dashboard.thresholds')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: v2.fontUI,
                      fontSize: 10,
                      color: tone,
                      fontWeight: '700',
                    }}
                  >
                    {pct}%{over ? ` · ${t('dashboard.statusExceeded')}` : near ? ` · ${t('dashboard.statusAlert')}` : ''}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
