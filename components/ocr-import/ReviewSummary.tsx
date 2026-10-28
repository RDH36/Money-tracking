import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { AccountPickerV2 } from '@/components/add';
import type { ImportStats } from '@/hooks/ocr/useCaptureImport';
import type { ReviewItem } from '@/lib/ocr/import/review';
import type { AccountWithBalance } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface ReviewSummaryProps {
  items: ReviewItem[];
  stats: ImportStats;
  appCurrency: string;
  accounts: AccountWithBalance[];
  onAccountChange: (accountId: string) => void;
  formatMoney: (cents: number) => string;
  getAccountName: (a: AccountWithBalance) => string;
}

export function ReviewSummary({
  items, stats, appCurrency, accounts, onAccountChange, formatMoney, getAccountName,
}: ReviewSummaryProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const duplicates = items.filter((i) => i.duplicate).length;
  const sharedAccount = items.every((i) => i.accountId === items[0]?.accountId) ? items[0]?.accountId ?? null : null;
  const readCurrency = items.find((i) => i.op.currency !== appCurrency)?.op.currency;

  const notices: { icon: IoniconName; text: string; tone: 'info' | 'warn' }[] = [];
  if (duplicates > 0) notices.push({ icon: 'copy-outline', text: t('ocrImport.duplicates', { count: duplicates }), tone: 'warn' });
  if (stats.merged > 0) notices.push({ icon: 'git-merge-outline', text: t('ocrImport.merged', { count: stats.merged }), tone: 'info' });
  if (stats.partial > 0) notices.push({ icon: 'cut-outline', text: t('ocrImport.partial', { count: stats.partial }), tone: 'info' });
  if (stats.unrecognized > 0) notices.push({ icon: 'help-circle-outline', text: t('ocrImport.unrecognized', { count: stats.unrecognized }), tone: 'info' });
  if (stats.failed > 0) notices.push({ icon: 'alert-circle-outline', text: t('ocrImport.failed', { count: stats.failed }), tone: 'warn' });
  if (readCurrency) notices.push({ icon: 'cash-outline', text: t('ocrImport.currencyMismatch', { read: readCurrency, app: appCurrency }), tone: 'warn' });

  return (
    <View>
      <View
        style={{
          backgroundColor: v2.bgInk, borderRadius: 18, padding: 16,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}
      >
        <View
          style={{
            width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(245,245,241,0.08)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="scan-outline" size={20} color={v2.inkOnDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: v2.fontDisplay, fontSize: 17, fontWeight: '700', color: v2.inkOnDark }}>
            {t('ocrImport.detected', { count: items.length })}
          </Text>
          <Text style={{ marginTop: 2, fontFamily: v2.fontUIRegular, fontSize: 12, color: v2.inkOnDarkM }}>
            {t('ocrImport.tapToEdit')}
          </Text>
        </View>
      </View>

      {notices.length > 0 ? (
        <View style={{ marginTop: 10, gap: 6 }}>
          {notices.map((n) => (
            <View
              key={n.text}
              style={{
                flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12,
                paddingHorizontal: 12, paddingVertical: 9,
                backgroundColor: n.tone === 'warn' ? v2.warnSoft : v2.bgSurface,
                borderWidth: n.tone === 'warn' ? 0 : 1, borderColor: v2.hairline,
              }}
            >
              <Ionicons name={n.icon} size={14} color={n.tone === 'warn' ? v2.warn : v2.inkMuted} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: n.tone === 'warn' ? v2.warn : v2.inkMuted }}>
                {n.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <AccountPickerV2
        accounts={accounts}
        selectedId={sharedAccount}
        onSelect={(id) => { if (id) onAccountChange(id); }}
        formatMoney={formatMoney}
        label={t('ocrImport.accountLabel')}
        getAccountName={getAccountName}
      />
    </View>
  );
}
