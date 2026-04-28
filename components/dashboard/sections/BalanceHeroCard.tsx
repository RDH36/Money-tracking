import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr, type V2Tokens } from '@/constants/designTokensV2';

interface OverspendBudget {
  name: string;
  overshoot: number;
}

interface BalanceHeroCardProps {
  totalBalance: number;
  accountsCount: number;
  monthIncome: number;
  monthExpense: number;
  balanceHidden: boolean;
  onToggleBalance: () => void;
  overspendBudget?: OverspendBudget;
  onOverspendPress?: () => void;
  currencyCode?: string;
}

export function BalanceHeroCard({
  totalBalance,
  accountsCount,
  monthIncome,
  monthExpense,
  balanceHidden,
  onToggleBalance,
  overspendBudget,
  onOverspendPress,
  currencyCode = 'Ar',
}: BalanceHeroCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const balanceText = balanceHidden ? '••••••' : formatMoneyFr(totalBalance);

  return (
    <View style={{ borderRadius: 22, overflow: 'hidden', position: 'relative' }}>
      <LinearGradient
        colors={[v2.bgInk, v2.bgInkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 22 }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -40, top: -40,
            width: 180, height: 180,
            borderRadius: 90,
            borderWidth: 1,
            borderColor: 'rgba(245,245,241,0.06)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -20, top: -20,
            width: 140, height: 140,
            borderRadius: 70,
            borderWidth: 1,
            borderColor: 'rgba(14,140,130,0.18)',
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600',
                letterSpacing: 1.5, textTransform: 'uppercase',
                color: v2.inkOnDarkM, marginBottom: 8,
              }}
            >
              {t('dashboard.netBalance')} · {t('dashboard.accountsCount', { count: accountsCount })}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <Text
                style={{
                  fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 42, lineHeight: 44,
                  letterSpacing: -1.5, color: v2.inkOnDark,
                }}
              >
                {balanceText}
              </Text>
              <Text
                style={{
                  fontSize: 22, marginLeft: 6, color: v2.inkOnDarkM,
                  fontFamily: v2.fontUI, fontWeight: '500',
                }}
              >
                {currencyCode}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onToggleBalance}
            hitSlop={6}
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: 'rgba(245,245,241,0.08)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons
              name={balanceHidden ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={v2.inkOnDark}
            />
          </Pressable>
        </View>

        <View style={{ marginTop: 18, flexDirection: 'row', gap: 18 }}>
          <DeltaCol
            v2={v2}
            label={t('dashboard.monthIncome')}
            value={monthIncome}
            currencyCode={currencyCode}
            iconName="arrow-up"
            iconColor="#7DD3A6"
          />
          <View style={{ width: 1, backgroundColor: 'rgba(245,245,241,0.1)' }} />
          <DeltaCol
            v2={v2}
            label={t('dashboard.monthExpense')}
            value={monthExpense}
            currencyCode={currencyCode}
            iconName="arrow-down"
            iconColor="#E8A99B"
          />
        </View>

        {overspendBudget ? (
          <Pressable
            onPress={onOverspendPress}
            style={{
              marginTop: 18, backgroundColor: 'rgba(200,68,44,0.18)',
              borderWidth: 1, borderColor: 'rgba(232,169,155,0.25)',
              borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}
          >
            <View
              style={{
                width: 24, height: 24, borderRadius: 12, backgroundColor: v2.bad,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="warning" size={13} color="#fff" />
            </View>
            <Text
              numberOfLines={1}
              style={{
                flex: 1, fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600',
                color: v2.inkOnDark, letterSpacing: 0.1,
              }}
            >
              {t('dashboard.thresholdExceededBanner', {
                name: overspendBudget.name,
                amount: `${formatMoneyFr(overspendBudget.overshoot)} ${currencyCode}`,
              })}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={v2.inkOnDarkM} />
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  );
}

interface DeltaColProps {
  v2: V2Tokens;
  label: string;
  value: number;
  currencyCode: string;
  iconName: 'arrow-up' | 'arrow-down';
  iconColor: string;
}

function DeltaCol({ v2, label, value, currencyCode, iconName, iconColor }: DeltaColProps) {
  return (
    <View>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, color: v2.inkOnDarkM,
          letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '600',
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <Ionicons name={iconName} size={12} color={iconColor} />
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13, fontVariant: ['tabular-nums'],
            color: v2.inkOnDark, fontWeight: '600',
          }}
        >
          {formatMoneyFr(value)} {currencyCode}
        </Text>
      </View>
    </View>
  );
}
