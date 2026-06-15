import { useState, useEffect } from 'react';
import { Pressable, View, TextInput, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useV2 } from '@/constants/designTokensV2';
import type { AccountWithBalance } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const ACCOUNT_ICONS: { icon: IoniconName }[] = [
  { icon: 'card' }, { icon: 'cash' }, { icon: 'wallet' },
  { icon: 'business' }, { icon: 'phone-portrait' }, { icon: 'globe' },
];

interface EditAccountModalProps {
  isOpen: boolean;
  account: AccountWithBalance | null;
  onClose: () => void;
  onSave: (id: string, params: { name?: string; icon?: string }) => Promise<boolean>;
}

export function EditAccountModal({ isOpen, account, onClose, onSave }: EditAccountModalProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('wallet');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setIcon(account.icon || 'wallet');
    }
  }, [account]);

  const handleSave = async () => {
    if (!account || !name.trim()) return;
    setIsSaving(true);
    await onSave(account.id, { name: name.trim(), icon });
    setIsSaving(false);
    onClose();
  };

  // Default accounts are protected and cannot be renamed
  if (!account || account.is_default === 1) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('account.editTitle')}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={onClose}
            disabled={isSaving}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              borderWidth: 1, borderColor: v2.hairlineStrong,
              alignItems: 'center', justifyContent: 'center',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || isSaving}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              backgroundColor: v2.bgInk,
              alignItems: 'center', justifyContent: 'center',
              opacity: !name.trim() || isSaving ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
              {isSaving ? '...' : t('common.save')}
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
                    backgroundColor: active ? v2.brandSoft : v2.bgRaised,
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
