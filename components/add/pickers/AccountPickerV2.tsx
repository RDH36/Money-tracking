import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';
import type { AccountWithBalance } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface AccountPickerV2Props {
  accounts: AccountWithBalance[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  formatMoney: (n: number) => string;
  label: string;
  getAccountName?: (a: AccountWithBalance) => string;
}

export function AccountPickerV2({
  accounts,
  selectedId,
  onSelect,
  formatMoney,
  label,
  getAccountName,
}: AccountPickerV2Props) {
  const v2 = useV2();
  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {accounts.map((account) => {
          const active = account.id === selectedId;
          const name = getAccountName ? getAccountName(account) : account.name;
          return (
            <Pressable
              key={account.id}
              onPress={() => onSelect(active ? null : account.id)}
              style={{
                minWidth: 160,
                backgroundColor: active ? v2.brandTint : v2.bgSurface,
                borderRadius: 18,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? v2.brand : v2.hairline,
                paddingVertical: 12,
                paddingHorizontal: 12,
                flexShrink: 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons
                  name={(account.icon as IoniconName) ?? 'wallet-outline'}
                  size={16}
                  color={active ? v2.brand : v2.inkSubtle}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: v2.fontUI,
                    fontSize: 12,
                    fontWeight: active ? '700' : '600',
                    color: active ? v2.brand : v2.inkMuted,
                    flexShrink: 1,
                  }}
                >
                  {name}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 6,
                  fontFamily: v2.fontUI,
                  fontSize: 13,
                  fontWeight: '700',
                  color: active ? v2.brandDeep : v2.ink,
                  fontVariant: ['tabular-nums'],
                  letterSpacing: -0.2,
                }}
              >
                {formatMoney(account.current_balance)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
