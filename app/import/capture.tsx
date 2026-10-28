import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useAccounts, useCategories } from '@/hooks';
import { useCaptureImport } from '@/hooks/ocr/useCaptureImport';
import { useCurrency } from '@/stores/settingsStore';
import { formatCurrency } from '@/lib/currency';
import { SOURCE_PARSERS } from '@/lib/ocr';
import { SettingsHeader } from '@/components/settings/v2/SettingsHeader';
import {
  EditOperationSheet, ImportStateView, OperationRow, ReviewSummary, openCaptureImport, pickCaptures,
} from '@/components/ocr-import';
import { ReviewList } from '@/components/ocr-import/review/ReviewList';
import { ReadingView } from '@/components/ocr-import/states/ReadingView';
import { DoneView } from '@/components/ocr-import/states/DoneView';
import { EmptyView } from '@/components/ocr-import/states/EmptyView';
import type { AccountWithBalance } from '@/types';

function parseUris(raw: string | undefined): string[] {
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

/** Nouvelle sélection dans la galerie : remplace l'import affiché. */
async function importMore() {
  try {
    openCaptureImport(await pickCaptures(), true);
  } catch (err) {
    console.warn('Image picker failed:', err);
  }
}

export default function ImportCaptureScreen() {
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const currency = useCurrency();
  const params = useLocalSearchParams<{ uris?: string }>();
  const uris = useMemo(() => parseUris(params.uris), [params.uris]);
  const imp = useCaptureImport(uris);
  const { accounts } = useAccounts();
  const { expenseCategories } = useCategories();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const formatMoney = (cents: number) => formatCurrency(cents, currency.code);
  const getAccountName = (a: AccountWithBalance): string =>
    a.is_default === 1 ? (a.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash')) : a.name;
  const accountName = (id: string | null) => {
    const a = accounts.find((acc) => acc.id === id);
    return a ? getAccountName(a) : null;
  };
  const sourceLabel = SOURCE_PARSERS.find((p) => p.id === imp.stats.sources[0])?.label ?? null;
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
    const notice = imp.saveFailed
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
            onToggle={() => imp.toggle(item.key)}
            onPress={() => setEditingKey(item.key)}
          />
        )}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <SettingsHeader title={t('ocrImport.title')} subtitle={t('ocrImport.overline')} onBack={close} />
      </View>
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
    </View>
  );
}
