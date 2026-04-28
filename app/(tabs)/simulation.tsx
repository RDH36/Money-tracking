import { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PlanificationCard } from '@/components/PlanificationCard';
import { ValidatePlanificationDialog } from '@/components/ValidatePlanificationDialog';
import { usePlanifications, useBalance, useAccounts, useTips, useGamification } from '@/hooks';
import { usePostHog } from 'posthog-react-native';
import { EmptyState } from '@/components/premium';
import { useV2 } from '@/constants/designTokensV2';
import { formatMonthLabelFr } from '@/components/dashboard';
import { BalancePreviewCard, NewPlanificationForm } from '@/components/planification';
import type { PlanificationWithTotal } from '@/types';

export default function PlanificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const { balance, refresh: refreshBalance } = useBalance();
  const { accounts, refresh: refreshAccounts, formatMoney } = useAccounts();
  const {
    planifications, createPlanification, deletePlanification,
    validatePlanification, checkExpiredPlanifications, refresh, isLoading,
  } = usePlanifications();
  const { currentTip, showTip } = useTips('planification');
  const gamification = useGamification();
  const posthog = usePostHog();

  useFocusEffect(useCallback(() => {
    refresh(); refreshBalance(); refreshAccounts(); checkExpiredPlanifications();
  }, [refresh, refreshBalance, refreshAccounts, checkExpiredPlanifications]));

  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlanificationWithTotal | null>(null);
  const [validateTarget, setValidateTarget] = useState<PlanificationWithTotal | null>(null);

  const pending = planifications.filter((p) => p.status === 'pending');
  const completed = planifications.filter((p) => p.status === 'completed');
  const totalPendingExp = pending.reduce((s, p) => s + (p.total_expenses || 0), 0);
  const totalPendingInc = pending.reduce((s, p) => s + (p.total_income || 0), 0);

  const handleCreate = async (title: string, deadline: Date | null) => {
    const result = await createPlanification(title, deadline);
    if (result.success && result.id) {
      posthog.capture('planification_created', { has_deadline: !!deadline });
      await gamification.checkDailyChallenge('create_planification');
      setShowNewForm(false);
      router.push(`/planification/${result.id}` as Href);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    posthog.capture('planification_deleted');
    await deletePlanification(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleValidateConfirm = async (planificationId: string, accountId: string) => {
    const result = await validatePlanification(planificationId, accountId);
    if (result.success) {
      posthog.capture('planification_validated');
      await gamification.checkDailyChallenge('check_planification');
      await refreshBalance(); await refreshAccounts();
    }
    return result;
  };

  const overlineStyle = {
    fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700' as const,
    letterSpacing: 1.5, textTransform: 'uppercase' as const,
    color: v2.inkSubtle, marginBottom: 4,
  };

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 18 }}>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={overlineStyle}>{formatMonthLabelFr(new Date(), i18n.language)}</Text>
                <Text style={{ fontFamily: v2.fontDisplay, fontSize: 28, color: v2.ink, letterSpacing: -0.8, lineHeight: 30 }}>
                  {t('planification.title')}
                </Text>
              </View>
              {!showNewForm ? (
                <Pressable
                  onPress={() => setShowNewForm(true)}
                  hitSlop={6}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: v2.brandSoft,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={18} color={v2.brand} />
                </Pressable>
              ) : null}
            </View>
            {showTip && currentTip ? (
              <View style={{
                marginTop: 10, padding: 12, borderRadius: 12,
                backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <Ionicons name="bulb-outline" size={14} color={v2.brand} />
                <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted }}>
                  {t(currentTip)}
                </Text>
              </View>
            ) : null}
          </View>

          <BalancePreviewCard
            balance={balance}
            totalPendingExpenses={totalPendingExp}
            totalPendingIncome={totalPendingInc}
            formatMoney={formatMoney}
          />

          {showNewForm ? (
            <NewPlanificationForm
              onCreate={handleCreate}
              onCancel={() => setShowNewForm(false)}
              isLoading={isLoading}
            />
          ) : null}

          {pending.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={overlineStyle}>{t('planification.pending')} · {pending.length}</Text>
              {pending.map((p) => (
                <PlanificationCard
                  key={p.id} planification={p}
                  onPress={() => router.push(`/planification/${p.id}` as Href)}
                  onLongPress={() => setDeleteTarget(p)}
                  onValidate={() => setValidateTarget(p)}
                  onDelete={() => setDeleteTarget(p)}
                  formatMoney={formatMoney}
                />
              ))}
            </View>
          ) : null}

          {completed.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={overlineStyle}>{t('planification.completed')} · {completed.length}</Text>
              {completed.map((p) => (
                <PlanificationCard
                  key={p.id} planification={p}
                  onPress={() => router.push(`/planification/${p.id}` as Href)}
                  formatMoney={formatMoney}
                />
              ))}
            </View>
          ) : null}

          {planifications.length === 0 && !showNewForm ? (
            <View style={{ paddingVertical: 30 }}>
              <EmptyState
                icon="clipboard-outline"
                title={t('planification.emptyMessage')}
                image={require('@/assets/images/bubule-detente.png')}
                action={
                  <Pressable
                    onPress={() => setShowNewForm(true)}
                    style={{ backgroundColor: v2.bgInk, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 }}
                  >
                    <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
                      {t('planification.createButton')}
                    </Text>
                  </Pressable>
                }
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        isOpen={!!deleteTarget} title={t('common.delete')}
        message={t('common.deleteItem', { name: deleteTarget?.title })}
        confirmText={t('common.delete')} isDestructive
        onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm}
      />
      <ValidatePlanificationDialog
        isOpen={!!validateTarget} planification={validateTarget}
        accounts={accounts}
        onClose={() => setValidateTarget(null)}
        onValidate={handleValidateConfirm} formatMoney={formatMoney}
      />
    </View>
  );
}
