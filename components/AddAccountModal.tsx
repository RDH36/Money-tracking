import { useState } from 'react';
import { Pressable, View, TextInput, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, parseAmount } from '@/lib/amountInput';
import type { AccountType } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const ACCOUNT_ICONS: { icon: IoniconName }[] = [
  { icon: 'card' }, { icon: 'cash' }, { icon: 'wallet' },
  { icon: 'business' }, { icon: 'phone-portrait' }, { icon: 'globe' },
];

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: (params: {
    name: string;
    type: AccountType;
    initialBalance: number;
    icon: string;
  }) => Promise<{ success: boolean; limitReached: boolean } | void>;
  canCreateAccount: boolean;
  customAccountsCount: number;
  maxCustomAccounts: number;
}

export function AddAccountModal({
  isOpen,
  onClose,
  onCreateAccount,
  canCreateAccount,
  customAccountsCount,
  maxCustomAccounts,
}: AddAccountModalProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const currency = useCurrency();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [icon, setIcon] = useState<string>('wallet');
  const [balance, setBalance] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setName(''); setType('bank'); setIcon('wallet'); setBalance('');
  };
  const handleClose = () => { resetForm(); onClose(); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    await onCreateAccount({
      name: name.trim(), type,
      initialBalance: parseAmount(balance), icon,
    });
    resetForm();
    setIsCreating(false);
  };

  if (!canCreateAccount) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={t('account.limitReached')}
        scrollable={false}
        footer={
          <Pressable
            onPress={handleClose}
            style={{
              backgroundColor: v2.bgInk, borderRadius: 12,
              paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
              {t('common.understood')}
            </Text>
          </Pressable>
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: v2.badSoft,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="alert-circle" size={20} color={v2.bad} />
          </View>
          <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, color: v2.ink }}>
            {t('account.limitMessage', { max: maxCustomAccounts })}
          </Text>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={t('account.new')}
      overline={t('account.customCount', { count: customAccountsCount, max: maxCustomAccounts })}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={handleClose}
            disabled={isCreating}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              borderWidth: 1, borderColor: v2.hairlineStrong,
              alignItems: 'center', justifyContent: 'center',
              opacity: isCreating ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCreate}
            disabled={!name.trim() || isCreating}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              backgroundColor: v2.bgInk,
              alignItems: 'center', justifyContent: 'center',
              opacity: !name.trim() || isCreating ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
              {isCreating ? t('account.creating') : t('account.create')}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ gap: 16 }}>
        <Field v2={v2} label={t('account.name')}>
          <View style={{ backgroundColor: v2.bgRaised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
            <TextInput
              placeholder={t('account.namePlaceholder')} placeholderTextColor={v2.inkSubtle}
              value={name} onChangeText={setName} maxLength={20}
              style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
            />
          </View>
          <Text style={{ marginTop: 4, textAlign: 'right', fontFamily: v2.fontUI, fontSize: 10, color: v2.inkSubtle, fontVariant: ['tabular-nums'] }}>
            {name.length} / 20
          </Text>
        </Field>

        <Field v2={v2} label={t('account.type')}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TypeBtn v2={v2} active={type === 'bank'} icon="card" label={t('account.bank')} onPress={() => setType('bank')} />
            <TypeBtn v2={v2} active={type === 'cash'} icon="cash" label={t('account.cash')} onPress={() => setType('cash')} />
          </View>
        </Field>

        <Field v2={v2} label={t('account.icon')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ACCOUNT_ICONS.map((item) => {
              const active = icon === item.icon;
              return (
                <Pressable
                  key={item.icon}
                  onPress={() => setIcon(item.icon)}
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: active ? v2.brandTint : v2.bgRaised,
                    borderWidth: active ? 1.5 : 0, borderColor: v2.brand,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name={item.icon} size={22} color={active ? v2.brand : v2.inkSubtle} />
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field v2={v2} label={t('account.initialBalance', { currency: currency.code })}>
          <View style={{ backgroundColor: v2.bgRaised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
            <TextInput
              placeholder="0" placeholderTextColor={v2.inkSubtle}
              keyboardType="decimal-pad" value={balance}
              onChangeText={(text) => setBalance(formatAmountInput(text))}
              style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
            />
          </View>
        </Field>
      </View>
    </BottomSheet>
  );
}

interface FieldProps { v2: ReturnType<typeof useV2>; label: string; children: React.ReactNode; }
function Field({ v2, label, children }: FieldProps) {
  return (
    <View>
      <Text style={{
        fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
        letterSpacing: 1.5, textTransform: 'uppercase',
        color: v2.inkSubtle, marginBottom: 8,
      }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

interface TypeBtnProps { v2: ReturnType<typeof useV2>; active: boolean; icon: IoniconName; label: string; onPress: () => void; }
function TypeBtn({ v2, active, icon, label, onPress }: TypeBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, paddingVertical: 12, borderRadius: 12,
        backgroundColor: active ? v2.brandTint : v2.bgRaised,
        borderWidth: active ? 1.5 : 0, borderColor: v2.brand,
        alignItems: 'center', justifyContent: 'center', gap: 4,
      }}
    >
      <Ionicons name={icon} size={22} color={active ? v2.brand : v2.inkSubtle} />
      <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', color: active ? v2.brand : v2.inkSubtle }}>
        {label}
      </Text>
    </Pressable>
  );
}
