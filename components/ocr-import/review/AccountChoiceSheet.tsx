import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { accountIconName } from '@/lib/icons/accountIcon';
import type { AccountWithBalance } from '@/types';

interface AccountChoiceSheetProps {
  isOpen: boolean;
  /** Compte actuel de l'opération (coché). */
  selectedId: string | null;
  accounts: AccountWithBalance[];
  formatMoney: (cents: number) => string;
  getAccountName: (a: AccountWithBalance) => string;
  onSelect: (accountId: string) => void;
  onClose: () => void;
}

/** Liste des comptes : le choix ne change que le compte de l'opération ouverte. */
export function AccountChoiceSheet({
  isOpen, selectedId, accounts, formatMoney, getAccountName, onSelect, onClose,
}: AccountChoiceSheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('ocrImport.accountSheetTitle')} maxHeightPct={70}>
      <View style={{ gap: 8 }}>
        {accounts.map((a) => {
          const active = a.id === selectedId;
          return (
            <Pressable
              key={a.id}
              onPress={() => onSelect(a.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
                borderRadius: 16, borderWidth: active ? 1.5 : 1,
                borderColor: active ? v2.brand : v2.hairline, backgroundColor: active ? v2.brandTint : v2.bgSurface,
              }}
            >
              <Ionicons name={accountIconName(a.icon, 'wallet-outline')} size={18} color={active ? v2.brand : v2.inkSubtle} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: active ? v2.brand : v2.ink }}>
                  {getAccountName(a)}
                </Text>
                <Text numberOfLines={1} style={{ marginTop: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, fontVariant: ['tabular-nums'] }}>
                  {formatMoney(a.current_balance)}
                </Text>
              </View>
              {active ? <Ionicons name="checkmark" size={18} color={v2.brand} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
