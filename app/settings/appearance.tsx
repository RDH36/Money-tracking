import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useTheme } from '@/contexts';
import { useSettings, useAccounts } from '@/hooks';
import { getCurrencyByCode } from '@/constants/currencies';
import { AppearanceSection } from '@/components/settings';
import { CurrencyConversionDialog } from '@/components/CurrencyConversionDialog';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';
import { fetchExchangeRate } from '@/lib/exchangeRate';
import { checkInternetConnection } from '@/lib/network';

export default function AppearanceSettingsPage() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { themeId, setTheme } = useTheme();
  const { colorMode, setColorMode, currencyCode, changeCurrencyWithConversion, tipsEnabled, setTipsEnabled } = useSettings();
  const { convertAllBalances } = useAccounts();

  const [pendingCurrencyCode, setPendingCurrencyCode] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | undefined>();
  const [conversionError, setConversionError] = useState<string | undefined>();

  const handleCurrencyPress = async (code: string) => {
    if (code === currencyCode) return;
    setConversionError(undefined);
    setExchangeRate(undefined);
    setPendingCurrencyCode(code);
    setIsFetchingRate(true);
    const isConnected = await checkInternetConnection();
    if (!isConnected) { setIsFetchingRate(false); setConversionError('errors.noInternet'); return; }
    try {
      const rate = await fetchExchangeRate(currencyCode, code);
      setExchangeRate(rate);
    } catch { setConversionError('errors.unknown'); } finally { setIsFetchingRate(false); }
  };

  const handleCurrencyConversion = async () => {
    if (!pendingCurrencyCode || !exchangeRate) return;
    setIsConverting(true);
    try {
      const success = await convertAllBalances(exchangeRate);
      if (!success) { setConversionError('errors.conversionFailed'); return; }
      posthog.capture('currency_changed', { from_currency: currencyCode, to_currency: pendingCurrencyCode });
      await changeCurrencyWithConversion(pendingCurrencyCode, async () => true);
      setPendingCurrencyCode(null);
      setExchangeRate(undefined);
    } catch { setConversionError('errors.unknown'); } finally { setIsConverting(false); }
  };

  return (
    <SettingsPageWrapper title={t('settings.appearance')}>
      <AppearanceSection
        themeId={themeId}
        colorMode={colorMode}
        currencyCode={currencyCode}
        tipsEnabled={tipsEnabled}
        onThemeChange={(id) => { posthog.capture('theme_changed', { theme_id: id }); setTheme(id); }}
        onColorModeChange={(mode) => { posthog.capture('color_mode_changed', { mode }); setColorMode(mode as any); }}
        onCurrencyChange={handleCurrencyPress}
        onTipsEnabledChange={(enabled) => { posthog.capture('tips_toggled', { enabled }); setTipsEnabled(enabled); }}
      />
      <CurrencyConversionDialog
        isOpen={!!pendingCurrencyCode}
        fromCurrency={getCurrencyByCode(currencyCode)}
        toCurrency={getCurrencyByCode(pendingCurrencyCode || currencyCode)}
        isLoading={isConverting}
        isFetchingRate={isFetchingRate}
        exchangeRate={exchangeRate}
        error={conversionError}
        onClose={() => { if (!isConverting && !isFetchingRate) { setPendingCurrencyCode(null); setExchangeRate(undefined); setConversionError(undefined); } }}
        onConfirm={handleCurrencyConversion}
      />
    </SettingsPageWrapper>
  );
}
