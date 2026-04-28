import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr, type V2Tokens } from '@/constants/designTokensV2';
import { SectionHead } from '../SectionHead';
import type { AccountWithBalance } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface AccountsCarouselProps {
  accounts: AccountWithBalance[];
  balanceHidden: boolean;
  onAddPress: () => void;
  onAccountPress?: (id: string) => void;
  getAccountName?: (a: AccountWithBalance) => string;
  currencyCode?: string;
}

function tintForIndex(v2: V2Tokens, i: number): { bg: string; fg: string } {
  const slots = [
    { bg: v2.brandTint, fg: v2.brand },
    { bg: v2.warnSoft, fg: v2.warn },
    { bg: v2.bgRaised, fg: v2.inkMuted },
  ];
  return slots[i % slots.length];
}

export function AccountsCarousel({
  accounts,
  balanceHidden,
  onAddPress,
  onAccountPress,
  getAccountName,
  currencyCode = 'Ar',
}: AccountsCarouselProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View>
      <SectionHead
        overline={t('dashboard.yourMoney')}
        title={t('dashboard.accounts')}
        action={
          <Pressable
            onPress={onAddPress}
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
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {accounts.map((account, i) => {
          const tint = tintForIndex(v2, i);
          const name = getAccountName ? getAccountName(account) : account.name;
          const balanceText = balanceHidden
            ? '••••••'
            : formatMoneyFr(account.current_balance);
          const Wrapper: any = onAccountPress ? Pressable : View;

          return (
            <Wrapper
              key={account.id}
              onPress={onAccountPress ? () => onAccountPress(account.id) : undefined}
              style={{
                backgroundColor: v2.bgSurface,
                borderWidth: 1,
                borderColor: v2.hairline,
                borderRadius: 18,
                padding: 14,
                minWidth: 138,
                flexShrink: 0,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: tint.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={(account.icon as IoniconName) ?? 'wallet-outline'}
                    size={15}
                    color={tint.fg}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: v2.fontUI,
                    fontSize: 9,
                    fontWeight: '700',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: v2.inkSubtle,
                  }}
                >
                  {account.type === 'bank' ? t('dashboard.bank') : t('dashboard.cash')}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={{
                  fontFamily: v2.fontUI,
                  fontSize: 11,
                  color: v2.inkMuted,
                  marginBottom: 4,
                  fontWeight: '500',
                }}
              >
                {name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    fontFamily: v2.fontUI,
                    fontSize: 16,
                    fontWeight: '600',
                    color: v2.ink,
                    fontVariant: ['tabular-nums'],
                    letterSpacing: -0.2,
                  }}
                >
                  {balanceText}
                </Text>
                <Text
                  style={{
                    fontFamily: v2.fontUI,
                    fontSize: 10,
                    color: v2.inkSubtle,
                    marginLeft: 3,
                    fontWeight: '500',
                  }}
                >
                  {currencyCode}
                </Text>
              </View>
            </Wrapper>
          );
        })}
      </ScrollView>
    </View>
  );
}
