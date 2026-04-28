import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';
import type { AccountWithBalance } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface TransferFormV2Props {
  accounts: AccountWithBalance[];
  fromAccountId: string | null;
  toAccountId: string | null;
  onFromChange: (id: string | null) => void;
  onToChange: (id: string | null) => void;
  fromLabel: string;
  toLabel: string;
  getAccountName?: (a: AccountWithBalance) => string;
}

export function TransferFormV2({
  accounts,
  fromAccountId,
  toAccountId,
  onFromChange,
  onToChange,
  fromLabel,
  toLabel,
  getAccountName,
}: TransferFormV2Props) {
  const v2 = useV2();
  return (
    <View style={{ marginTop: 18, gap: 18 }}>
      <Section
        v2={v2}
        label={fromLabel}
        accounts={accounts}
        selectedId={fromAccountId}
        disabledId={toAccountId}
        onSelect={onFromChange}
        getAccountName={getAccountName}
      />
      <Section
        v2={v2}
        label={toLabel}
        accounts={accounts}
        selectedId={toAccountId}
        disabledId={fromAccountId}
        onSelect={onToChange}
        getAccountName={getAccountName}
      />
    </View>
  );
}

interface SectionProps {
  v2: V2Tokens;
  label: string;
  accounts: AccountWithBalance[];
  selectedId: string | null;
  disabledId: string | null;
  onSelect: (id: string | null) => void;
  getAccountName?: (a: AccountWithBalance) => string;
}

function Section({
  v2,
  label,
  accounts,
  selectedId,
  disabledId,
  onSelect,
  getAccountName,
}: SectionProps) {
  return (
    <View>
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
          const disabled = account.id === disabledId;
          const name = getAccountName ? getAccountName(account) : account.name;
          return (
            <Pressable
              key={account.id}
              onPress={() => onSelect(active ? null : account.id)}
              disabled={disabled}
              style={{
                minWidth: 140,
                backgroundColor: active ? v2.brandTint : v2.bgSurface,
                borderRadius: 18,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? v2.brand : v2.hairline,
                paddingVertical: 12,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
                opacity: disabled ? 0.4 : 1,
              }}
            >
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
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
