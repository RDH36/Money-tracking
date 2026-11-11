import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCaptureRequest } from '@/hooks/ocr/useCaptureRequest';
import { PickingView } from '@/components/ocr-import/states/PickingView';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useAccounts, useCategories } from '@/hooks';
import { useCaptureImport } from '@/hooks/ocr/useCaptureImport';
import { useCurrency } from '@/stores/settingsStore';
import { formatCurrency } from '@/lib/currency';
import { SOURCE_PARSERS } from '@/lib/ocr';
import {
  EditOperationSheet, ImportStateView, OperationRow, ReviewSummary,
} from '@/components/ocr-import';
import { ReviewList } from '@/components/ocr-import/review/ReviewList';
import { ReadingView } from '@/components/ocr-import/states/ReadingView';
import { DoneView } from '@/components/ocr-import/states/DoneView';
import { EmptyView } from '@/components/ocr-import/states/EmptyView';
import { useOcrQuota } from '@/hooks/premium/useOcrQuota';
import { consumedReads, planReads, type ReadPlan } from '@/lib/premium';
import {
  correctedFields, genericReadProps, importSavedProps, readCompletedProps,
} from '@/lib/ocr/import/analytics';
import { accountsBelowZero, duplicateHint, type ReviewItem } from '@/lib/ocr/import/review';
import { getCategoryDisplayName } from '@/constants/categories';
import { CaptureFrame } from '@/components/ocr-import/states/CaptureFrame';
import { QuotaBlockedView } from '@/components/ocr-import/states/QuotaBlockedView';
import type { AccountWithBalance } from '@/types';

/**
 * Quota de lectures : décidé UNE fois par liste reçue (le compteur qui monte
 * après l'enregistrement ne relance pas la lecture). Au-delà du solde, seules
 * les N premières images sont lues ; solde nul → E4.
 */
export default function ImportCaptureScreen() {
  const params = useLocalSearchParams<{ uris?: string; source?: string; pick?: string }>();
  const { state, importMore } = useCaptureRequest(params);
  const quota = useOcrQuota();
  const plans = useRef(new Map<string, ReadPlan>());
  const [, rerender] = useState(0);
  const ready = state.status === 'ready' ? state : null;
  const key = ready?.key ?? '';
  const all = useMemo(() => ready?.uris ?? [], [ready]);
  let plan = ready ? plans.current.get(key) : undefined;
  if (ready && !plan && quota.loaded) {
    plan = planReads(all.length, quota.remaining, quota.unlimited);
    plans.current.set(key, plan);
  }
  // Limite atteinte en cours de route (images au-delà du solde) : signal de demande.
  const posthog = usePostHog();
  const truncReported = useRef(new Set<string>());
  const truncated = !!plan && plan.truncatedFrom !== null;
  useEffect(() => {
    if (!truncated || truncReported.current.has(key)) return;
    truncReported.current.add(key);
    posthog.capture('ocr_quota_reached', { limit: quota.limit, reads_used: quota.used, surface: 'truncated' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truncated, key]);
  if (state.status !== 'ready') return <PickingView error={state.status === 'error' ? state.error : null} />;
  // Quota en cours de chargement : même cadre et même lecture que la 1re image du flux.
  if (!plan) {
    return (
      <CaptureFrame>
        <ReadingView uri={all[0] ?? null} done={0} total={all.length} />
      </CaptureFrame>
    );
  }
  if (plan.blocked && !quota.unlimited) {
    return (
      <QuotaBlockedView
        limit={quota.limit} used={quota.used} resetsOn={quota.resetsOn}
        onUnlocked={() => {
          plans.current.set(key, planReads(all.length, Infinity, true));
          rerender((n) => n + 1);
        }}
      />
    );
  }
  return (
    <ImportCaptureFlow
      key={key} uris={all.slice(0, plan.allowed)} truncatedFrom={plan.truncatedFrom}
      source={state.source} onImportMore={importMore} consume={quota.unlimited ? null : quota.consume}
    />
  );
}

interface FlowProps {
  uris: string[];
  truncatedFrom: number | null;
  source: string;
  onImportMore: () => void;
  consume: ((reads: number) => Promise<void>) | null;
}

function ImportCaptureFlow({ uris, truncatedFrom, source, onImportMore: importMore, consume }: FlowProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const currency = useCurrency();
  const posthog = usePostHog();
  const onSaved = useCallback(async (inserted: ReviewItem[]) => {
    posthog.capture('ocr_import_saved', importSavedProps(inserted));
    for (const field of correctedFields(inserted)) posthog.capture('import_field_corrected', { field });
    try {
      await consume?.(consumedReads(inserted.map((i) => ({ image: i.op.image, forceDuplicate: i.forceDuplicate }))));
    } catch (err) {
      // Les opérations sont enregistrées : un compteur raté ne doit pas l'annuler.
      console.error('Counting OCR reads failed:', err);
    }
  }, [posthog, consume]);
  const imp = useCaptureImport(uris, onSaved);
  const reported = useRef(false);
  useEffect(() => {
    posthog.capture('ocr_import_started', { source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (imp.phase !== 'review' || reported.current) return;
    reported.current = true;
    posthog.capture('ocr_read_completed', readCompletedProps(imp.items, imp.stats.sources));
    const generic = genericReadProps(imp.items, source);
    if (generic) posthog.capture('import_generic_read', generic);
  }, [imp.phase, imp.items, imp.stats.sources, posthog]);
  const { accounts } = useAccounts();
  const { categories, expenseCategories } = useCategories();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const formatMoney = (cents: number) => formatCurrency(cents, currency.code);
  const getAccountName = (a: AccountWithBalance): string =>
    a.is_default === 1 ? (a.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash')) : a.name;
  const accountName = (id: string | null) => {
    const a = accounts.find((acc) => acc.id === id);
    return a ? getAccountName(a) : null;
  };
  const sourceLabel = imp.stats.sources
    .map((id) => t(`ocrImport.sources.${id}`, { defaultValue: SOURCE_PARSERS.find((p) => p.id === id)?.label ?? '' }))
    .filter(Boolean)
    .join(' · ') || null;
  const hintFormatters = {
    money: formatMoney,
    date: (ymd: string) => new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10))
      .toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
    category: (id: string | null | undefined) => {
      const c = categories.find((x) => x.id === id);
      return c ? getCategoryDisplayName(c.id, c.name, t) || null : null;
    },
  };
  const hintOf = (item: ReviewItem) => {
    const h = duplicateHint(item, hintFormatters);
    return h ? t(h.key, h.params) : null;
  };
  const editing = imp.items.find((i) => i.key === editingKey) ?? null;
  const close = () => router.back();

  let body;
  if (uris.length === 0 || imp.phase === 'error' || (imp.phase === 'review' && imp.items.length === 0 && imp.stats.failed === imp.stats.captures)) {
    body = (
      <ImportStateView
        icon="alert-circle-outline" tone="bad"
        title={t('ocrImport.errorTitle')} body={t('ocrImport.errorBody')}
        primary={{ label: t('ocrImport.pickOther'), onPress: importMore }}
        secondary={{ label: t('ocrImport.finish'), onPress: close }}
      />
    );
  } else if (imp.phase === 'reading') {
    body = <ReadingView uri={imp.currentUri} done={imp.progress.done} total={imp.progress.total} />;
  } else if (imp.phase === 'done') {
    body = (
      <DoneView count={imp.savedCount} onView={() => router.replace('/transactions')} onImportMore={importMore} />
    );
  } else if (imp.items.length === 0) {
    body = (
      <EmptyView reason={imp.stats.sources.length === 0 ? 'notMcb' : 'noOps'} onPickOther={importMore} onClose={close} />
    );
  } else {
    const dupSelected = imp.items.filter((i) => i.selected && i.duplicate).length;
    const cashBlocked = accountsBelowZero(imp.items, accounts).some((b) => b.blocked);
    const notice = cashBlocked
      ? { text: t('ocrImport.cashBlockedSave'), tone: 'bad' as const }
      : imp.saveFailed
      ? { text: t('ocrImport.saveFailed'), tone: 'bad' as const }
      : imp.invalidSelected > 0
        ? { text: t('ocrImport.invalid', { count: imp.invalidSelected }), tone: 'bad' as const }
        : dupSelected > 0
          ? { text: t('ocrImport.dupSelected', { count: dupSelected }), tone: 'warn' as const }
          : null;
    body = (
      <ReviewList
        items={imp.items}
        locale={i18n.language}
        selectedCount={imp.selectedCount}
        saving={imp.phase === 'saving'}
        notice={notice}
        onSave={imp.save}
        blocked={cashBlocked}
        onToggleMany={imp.toggleMany}
        header={
          <ReviewSummary
            items={imp.items} stats={imp.stats} sourceLabel={sourceLabel} appCurrency={currency.code}
            accounts={accounts} onAccountChange={imp.setAccountForAll}
            formatMoney={formatMoney} getAccountName={getAccountName}
          />
        }
        renderItem={(item) => (
          <OperationRow
            item={item}
            category={expenseCategories.find((c) => c.id === item.categoryId) ?? null}
            counterAccountName={accountName(item.counterAccountId)}
            formatMoney={formatMoney}
            hint={hintOf(item)}
            onToggle={() => imp.toggle(item.key)}
            onPress={() => setEditingKey(item.key)}
          />
        )}
      />
    );
  }

  return (
    <CaptureFrame>
      {truncatedFrom !== null && imp.phase !== 'done' ? (
        <Text style={{ paddingHorizontal: 20, paddingBottom: 8, fontFamily: v2.fontUI, fontSize: 12, color: v2.warn }}>
          {t('ocrImport.quota.truncated', { count: uris.length, total: truncatedFrom })}
        </Text>
      ) : null}
      {body}
      <EditOperationSheet
        item={editing}
        onClose={() => setEditingKey(null)}
        onApply={imp.update}
        accounts={accounts}
        categories={expenseCategories}
        currencySymbol={currency.symbol}
        currencyLocale={currency.locale}
        formatMoney={formatMoney}
        getAccountName={getAccountName}
      />
    </CaptureFrame>
  );
}
