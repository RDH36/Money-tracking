import { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useAccounts, useCategories } from '@/hooks';
import { useCaptureImport } from '@/hooks/ocr/useCaptureImport';
import { useCurrency } from '@/stores/settingsStore';
import { formatCurrency } from '@/lib/currency';
import { SOURCE_PARSERS } from '@/lib/ocr';
import { SettingsHeader } from '@/components/settings/v2/SettingsHeader';
import { EditOperationSheet, ImportStateView, OperationRow, ReviewSummary } from '@/components/ocr-import';
import type { AccountWithBalance } from '@/types';

function parseUris(raw: string | undefined): string[] {
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
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
  const sourceLabel = SOURCE_PARSERS.find((p) => p.id === imp.stats.sources[0])?.label;
  const editing = imp.items.find((i) => i.key === editingKey) ?? null;

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
      <SettingsHeader
        title={t('ocrImport.title')}
        subtitle={sourceLabel ? t('ocrImport.overline', { source: sourceLabel }) : t('ocrImport.overlineUnknown')}
        onBack={() => router.back()}
      />
    </View>
  );

  let body;
  if (imp.phase === 'reading') {
    body = (
      <ImportStateView
        title={t('ocrImport.reading', { current: Math.min(imp.progress.done + 1, imp.progress.total), total: imp.progress.total })}
        body={t('ocrImport.readingHint')}
      />
    );
  } else if (imp.phase === 'error' || uris.length === 0) {
    body = (
      <ImportStateView
        icon="alert-circle-outline" tone="bad"
        title={t('ocrImport.errorTitle')} body={t('ocrImport.errorBody')}
        primary={{ label: t('ocrImport.finish'), onPress: () => router.back() }}
      />
    );
  } else if (imp.phase === 'done') {
    body = (
      <ImportStateView
        icon="checkmark-circle-outline" tone="good"
        title={t('ocrImport.doneTitle', { count: imp.savedCount })} body={t('ocrImport.doneBody')}
        primary={{ label: t('ocrImport.viewHistory'), onPress: () => router.replace('/(tabs)/history') }}
        secondary={{ label: t('ocrImport.finish'), onPress: () => router.back() }}
      />
    );
  } else if (imp.items.length === 0) {
    body = (
      <ImportStateView
        icon="document-text-outline"
        title={t('ocrImport.emptyTitle')} body={t('ocrImport.emptyBody')}
        primary={{ label: t('ocrImport.finish'), onPress: () => router.back() }}
      />
    );
  } else {
    const saving = imp.phase === 'saving';
    body = (
      <>
        <FlatList
          data={imp.items}
          keyExtractor={(i) => i.key}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <ReviewSummary
                items={imp.items} stats={imp.stats} appCurrency={currency.code}
                accounts={accounts} onAccountChange={imp.setAccountForAll}
                formatMoney={formatMoney} getAccountName={getAccountName}
              />
            </View>
          }
          renderItem={({ item }) => (
            <OperationRow
              item={item}
              category={expenseCategories.find((c) => c.id === item.categoryId) ?? null}
              counterAccountName={accountName(item.counterAccountId)}
              formatMoney={formatMoney}
              locale={i18n.language}
              onToggle={() => imp.toggle(item.key)}
              onPress={() => setEditingKey(item.key)}
            />
          )}
        />
        <View
          style={{
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16,
            borderTopWidth: 1, borderTopColor: v2.hairline, backgroundColor: v2.bgBase,
          }}
        >
          {imp.saveFailed || imp.invalidSelected > 0 ? (
            <Text style={{ marginBottom: 8, fontFamily: v2.fontUI, fontSize: 12, color: v2.bad, textAlign: 'center' }}>
              {imp.saveFailed ? t('ocrImport.saveFailed') : t('ocrImport.invalid', { count: imp.invalidSelected })}
            </Text>
          ) : null}
          <Pressable
            onPress={imp.save}
            disabled={imp.selectedCount === 0 || saving}
            style={{
              backgroundColor: v2.bgInk, borderRadius: 14, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: imp.selectedCount === 0 || saving ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.inkOnDark }}>
              {saving
                ? t('ocrImport.saving')
                : imp.selectedCount === 0
                  ? t('ocrImport.saveNone')
                  : t('ocrImport.save', { count: imp.selectedCount })}
            </Text>
            {!saving && imp.selectedCount > 0 ? <Ionicons name="checkmark" size={15} color={v2.inkOnDark} /> : null}
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      {header}
      {body}
      <EditOperationSheet
        item={editing}
        onClose={() => setEditingKey(null)}
        onApply={imp.update}
        accounts={accounts}
        categories={expenseCategories}
        currencySymbol={currency.symbol}
        formatMoney={formatMoney}
        getAccountName={getAccountName}
      />
    </View>
  );
}
