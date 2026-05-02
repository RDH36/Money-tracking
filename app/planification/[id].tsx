import { useCallback, useState } from 'react';
import { View, Pressable, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AddItemForm } from '@/components/planification/AddItemForm';
import { ItemList } from '@/components/planification/ItemList';
import { BalancePreviewCard } from '@/components/planification';
import { DeadlineCard } from '@/components/planification/DeadlineCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ValidatePlanificationDialog } from '@/components/ValidatePlanificationDialog';
import { EmptyState } from '@/components/premium';
import { usePlanificationDetail, useBalance, usePlanifications, useAccounts } from '@/hooks';
import { usePostHog } from 'posthog-react-native';
import { useCurrency } from '@/stores/settingsStore';
import { useV2 } from '@/constants/designTokensV2';

function formatDate(dateStr: string, language: string = 'fr'): string {
  const date = new Date(dateStr);
  const localeMap: Record<string, string> = { fr: 'fr-FR', en: 'en-US', mg: 'fr-MG' };
  return date.toLocaleDateString(localeMap[language] || 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export default function PlanificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currency = useCurrency();
  const posthog = usePostHog();
  const { balance, refresh: refreshBalance } = useBalance();
  const { accounts, refresh: refreshAccounts, formatMoney } = useAccounts();
  const { validatePlanification, updateDeadline } = usePlanifications();
  const {
    planification, items, linkedTransactions, total,
    addItem, removeItem, deleteLinkedTransaction, updateTitle,
    refresh: refreshDetail, isLoading, isFetching,
  } = usePlanificationDetail(id || null);

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  useFocusEffect(useCallback(() => { refreshDetail(); }, [refreshDetail]));

  const isPending = planification?.status === 'pending';
  const expired = isPending && isExpired(planification?.deadline || null);
  const totalExpenses = items.reduce((s, item) => item.type !== 'income' ? s + item.amount : s, 0);
  const totalIncome = items.reduce((s, item) => item.type === 'income' ? s + item.amount : s, 0);

  const handleDeadlineChange = async (selectedDate: Date) => {
    if (id && planification) {
      await updateDeadline(id, planification.title, selectedDate);
      await refreshDetail();
    }
  };
  const handleRemoveDeadline = async () => {
    if (id && planification) {
      await updateDeadline(id, planification.title, null);
      await refreshDetail();
    }
  };
  const handleAddItem = async (amount: number, type: string, categoryId: string | null, note: string | null) => {
    await addItem(amount, type as any, categoryId, note);
    posthog.capture('planification_item_added', { item_type: type, has_note: !!note, currency: currency.code });
  };
  const handleValidateConfirm = async (planificationId: string, accountId: string) => {
    const result = await validatePlanification(planificationId, accountId);
    if (result.success) { await refreshBalance(); await refreshAccounts(); router.back(); }
    return result;
  };
  const startEditTitle = () => {
    if (!isPending || !planification) return;
    setTitleDraft(planification.title);
    setEditingTitle(true);
  };
  const saveTitle = async () => {
    if (!editingTitle) return;
    const trimmed = titleDraft.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === planification?.title) return;
    const ok = await updateTitle(trimmed);
    if (ok) posthog.capture('planification_renamed');
  };
  const handleDeleteTransactionConfirm = async () => {
    if (!deleteTransactionId) return;
    posthog.capture('planification_transaction_deleted');
    const result = await deleteLinkedTransaction(deleteTransactionId);
    setDeleteTransactionId(null);
    if (result === 'deleted_planification') { router.replace('/(tabs)/simulation'); return; }
    await refreshBalance();
    await refreshAccounts();
  };

  if (!planification && !isFetching) {
    return (
      <View style={{ flex: 1, backgroundColor: v2.bgBase, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <EmptyState icon="document-text-outline" title={t('planification.notFound')} />
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: v2.hairlineStrong }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
            {t('onboarding.back')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        bottomOffset={20}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={6}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: v2.bgSurface,
              borderWidth: 1, borderColor: v2.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={18} color={v2.ink} />
          </Pressable>
          {editingTitle ? (
            <TextInput
              value={titleDraft}
              onChangeText={setTitleDraft}
              onSubmitEditing={saveTitle}
              onBlur={saveTitle}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              style={{
                flex: 1, fontFamily: v2.fontDisplay, fontWeight: '700',
                fontSize: 22, color: v2.ink, letterSpacing: -0.5, padding: 0,
              }}
            />
          ) : (
            <Pressable
              onPress={startEditTitle}
              disabled={!isPending}
              hitSlop={6}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1, fontFamily: v2.fontDisplay, fontWeight: '700',
                  fontSize: 22, color: v2.ink, letterSpacing: -0.5,
                }}
              >
                {planification?.title || t('common.loading')}
              </Text>
              {isPending ? (
                <Ionicons name="pencil" size={14} color={v2.inkSubtle} />
              ) : null}
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          {isPending ? (
            <DeadlineCard
              deadline={planification?.deadline ?? null}
              expired={Boolean(expired)}
              formatDate={(d) => formatDate(d, i18n.language)}
              onChange={handleDeadlineChange}
              onRemove={handleRemoveDeadline}
            />
          ) : (
            <View
              style={{
                backgroundColor: v2.goodSoft,
                borderWidth: 1, borderColor: v2.good + '40',
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row', gap: 10, alignItems: 'flex-start',
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={v2.good} />
              <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, color: v2.ink, lineHeight: 17 }}>
                {t('planification.validatedMessage')}
              </Text>
            </View>
          )}

          <BalancePreviewCard
            balance={balance}
            totalPendingExpenses={isPending ? totalExpenses : 0}
            totalPendingIncome={isPending ? totalIncome : 0}
            formatMoney={formatMoney}
          />

          {isPending ? <AddItemForm isLoading={isLoading} onAddItem={handleAddItem} /> : null}

          <ItemList
            items={items}
            isPending={Boolean(isPending)}
            linkedTransactions={linkedTransactions}
            formatMoney={formatMoney}
            onDeleteItem={(itemId) => setDeleteItemId(itemId)}
            onDeleteTransaction={(txId) => setDeleteTransactionId(txId)}
          />

          {isPending && items.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={6}
                style={{
                  width: 52, height: 52, borderRadius: 12,
                  borderWidth: 1, borderColor: v2.hairlineStrong,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="save-outline" size={18} color={v2.ink} />
              </Pressable>
              <Pressable
                onPress={() => setShowValidateDialog(true)}
                style={{
                  flex: 1, height: 52, borderRadius: 12,
                  backgroundColor: v2.bgInk,
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={v2.inkOnDark} />
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.inkOnDark }}
                >
                  {t('planification.validateAndDeduct')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      <ConfirmDialog
        isOpen={!!deleteItemId}
        title={t('common.delete')}
        message={t('planification.deleteItemConfirm')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteItemId(null)}
        onConfirm={async () => {
          if (deleteItemId) {
            posthog.capture('planification_item_deleted');
            await removeItem(deleteItemId);
            setDeleteItemId(null);
          }
        }}
      />
      <ConfirmDialog
        isOpen={!!deleteTransactionId}
        title={t('planification.deleteTransactionConfirm')}
        message={t('planification.deleteTransactionMessage')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteTransactionId(null)}
        onConfirm={handleDeleteTransactionConfirm}
      />
      <ValidatePlanificationDialog
        isOpen={showValidateDialog}
        planification={planification ? { ...planification, total, item_count: items.length } : null}
        accounts={accounts}
        onClose={() => setShowValidateDialog(false)}
        onValidate={handleValidateConfirm}
        formatMoney={formatMoney}
      />
    </View>
  );
}
