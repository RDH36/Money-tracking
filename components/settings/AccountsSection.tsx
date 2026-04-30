import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useBalanceHidden } from '@/stores/settingsStore';
import { SectionLabel, SettingsCard } from '@/components/settings/v2';
import type { AccountWithBalance } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface AccountsSectionProps {
  accounts: AccountWithBalance[];
  formatMoney: (amount: number) => string;
  onDelete: (account: AccountWithBalance) => void;
  onAdd?: () => void;
}

function alpha15(hex: string): string {
  if (hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

export function AccountsSection({ accounts, formatMoney, onDelete, onAdd }: AccountsSectionProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const balanceHidden = useBalanceHidden();
  const total = accounts.reduce((s, a) => s + a.current_balance, 0);

  const getName = (account: AccountWithBalance) => {
    if (account.is_default === 1) {
      return account.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash');
    }
    return account.name;
  };

  return (
    <View>
      <View style={{ borderRadius: 18, overflow: 'hidden' }}>
        <LinearGradient
          colors={[v2.bgInk, v2.bgInkSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 22, position: 'relative' }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', right: -40, bottom: -40,
              width: 140, height: 140, borderRadius: 70,
              backgroundColor: 'rgba(14,140,130,0.15)',
            }}
          />
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
              letterSpacing: 1.5, textTransform: 'uppercase',
              color: v2.inkOnDarkM, marginBottom: 8,
            }}
          >
            {t('accountsV2.totalLabel', { count: accounts.length })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontFamily: v2.fontDisplay, fontSize: 38,
                color: v2.inkOnDark, letterSpacing: -1, lineHeight: 40,
                fontVariant: ['tabular-nums'],
              }}
            >
              {balanceHidden ? '••••••' : formatMoney(total)}
            </Text>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.inkOnDarkM }}>Ar</Text>
          </View>
        </LinearGradient>
      </View>

      <SectionLabel
        action={
          onAdd ? (
            <Pressable
              onPress={onAdd}
              hitSlop={6}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: v2.brandSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={15} color={v2.brand} />
            </Pressable>
          ) : undefined
        }
      >
        {t('accountsV2.myAccounts')}
      </SectionLabel>

      <SettingsCard>
        {accounts.map((acc, i) => {
          const isLast = i === accounts.length - 1;
          const color = acc.type === 'bank' ? '#3B82F6' : v2.good;
          const iconName: IoniconName = (acc.icon as IoniconName) ?? 'wallet-outline';
          return (
            <View
              key={acc.id}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 14, paddingHorizontal: 14,
                borderBottomWidth: isLast ? 0 : 1, borderBottomColor: v2.hairline,
              }}
            >
              <View
                style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: alpha15(color),
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name={iconName} size={17} color={color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}>
                  {getName(acc)}
                </Text>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 2 }}>
                  {acc.type === 'bank' ? t('account.bank') : t('account.cash')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                    color: v2.ink, fontVariant: ['tabular-nums'],
                  }}
                >
                  {balanceHidden ? '••••••' : formatMoney(acc.current_balance)}
                </Text>
                {acc.is_default === 0 ? (
                  <Pressable onPress={() => onDelete(acc)} hitSlop={6}>
                    <Ionicons name="trash-outline" size={18} color={v2.bad} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </SettingsCard>

      <View
        style={{
          marginTop: 14, paddingVertical: 14, paddingHorizontal: 16,
          borderRadius: 14, backgroundColor: v2.brandTint,
          borderWidth: 1, borderColor: v2.brand + '40',
          flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        }}
      >
        <Ionicons name="information-circle-outline" size={16} color={v2.brand} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.brandDeep, lineHeight: 17 }}>
          <Text style={{ fontWeight: '700' }}>{t('accountsV2.tipPrefix')} </Text>
          {t('accountsV2.tip')}
        </Text>
      </View>
    </View>
  );
}
