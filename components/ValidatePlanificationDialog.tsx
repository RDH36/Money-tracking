import { useState } from 'react';
import { Pressable, View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { CenterDialog } from '@/components/ui/CenterDialog';
import {
  DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn,
} from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import { useBalanceHidden } from '@/stores/settingsStore';
import type { AccountWithBalance, PlanificationWithTotal } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface ValidatePlanificationDialogProps {
  isOpen: boolean;
  planification: PlanificationWithTotal | null;
  accounts: AccountWithBalance[];
  onClose: () => void;
  onValidate: (planificationId: string, accountId: string) => Promise<{ success: boolean; error?: string }>;
  formatMoney: (amount: number) => string;
}

export function ValidatePlanificationDialog({
  isOpen, planification, accounts, onClose, onValidate, formatMoney,
}: ValidatePlanificationDialogProps) {
  const { t } = useTranslation();
  const v2 = useV2();
  const balanceHidden = useBalanceHidden();
  const hiddenAmount = '••••••';
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!planification || !selectedAccountId) return;
    setIsLoading(true); setError(null);
    const result = await onValidate(planification.id, selectedAccountId);
    setIsLoading(false);
    if (result.success) {
      setSelectedAccountId(null); onClose();
    } else if (result.error) setError(result.error);
  };

  const handleClose = () => {
    setSelectedAccountId(null); setError(null); onClose();
  };

  const accountColor = (type: string) => type === 'bank' ? v2.brand : v2.warn;
  const accountName = (a: AccountWithBalance) =>
    a.is_default === 1
      ? a.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash')
      : a.name;

  return (
    <CenterDialog
      isOpen={isOpen && !!planification}
      onClose={handleClose}
      title={t('planification.validate')}
      iconName="checkmark-circle-outline"
      iconBg={v2.brandSoft}
      iconColor={v2.brand}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('common.cancel')} onPress={handleClose} />
          <DialogPrimaryBtn
            label={isLoading ? t('planification.validating') : t('planification.validate')}
            onPress={handleValidate}
            disabled={!selectedAccountId}
            isLoading={isLoading}
          />
        </DialogButtonRow>
      }
    >
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted,
            lineHeight: 19, textAlign: 'center',
          }}
        >
          {t('planification.deductFromAccount', { amount: formatMoney(planification?.total ?? 0) })}
        </Text>
        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 8 }}>
            {accounts.map((account) => {
              const isSel = selectedAccountId === account.id;
              const color = accountColor(account.type);
              const enough = account.current_balance >= (planification?.total ?? 0);
              return (
                <Pressable
                  key={account.id}
                  disabled={!enough}
                  onPress={() => { setSelectedAccountId(account.id); setError(null); }}
                  style={{
                    padding: 12, borderRadius: 12,
                    backgroundColor: isSel ? color + '22' : v2.bgRaised,
                    borderWidth: 1,
                    borderColor: isSel ? color : 'transparent',
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10, opacity: enough ? 1 : 0.5,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <Ionicons name={account.icon as IoniconName} size={18} color={color} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink,
                        }}
                      >
                        {accountName(account)}
                      </Text>
                      <Text
                        style={{
                          marginTop: 1, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                      </Text>
                    </View>
                  </View>
                  {isSel ? (
                    <Ionicons name="checkmark-circle" size={20} color={color} />
                  ) : !enough ? (
                    <Text style={{ fontFamily: v2.fontUI, fontSize: 10, color: v2.bad }}>
                      {t('planification.insufficientBalance')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        {error ? (
          <View
            style={{
              padding: 10, borderRadius: 10,
              backgroundColor: v2.badSoft,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.bad, textAlign: 'center' }}>
              {t(error)}
            </Text>
          </View>
        ) : null}
      </View>
    </CenterDialog>
  );
}
