import { ActivityIndicator, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { CenterDialog } from '@/components/ui/CenterDialog';
import {
  DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn,
} from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import type { Currency } from '@/constants/currencies';

interface CurrencyConversionDialogProps {
  isOpen: boolean;
  fromCurrency: Currency;
  toCurrency: Currency;
  isLoading: boolean;
  isFetchingRate: boolean;
  exchangeRate?: number;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function CurrencyConversionDialog({
  isOpen, fromCurrency, toCurrency, isLoading, isFetchingRate,
  exchangeRate, error, onClose, onConfirm,
}: CurrencyConversionDialogProps) {
  const { t } = useTranslation();
  const v2 = useV2();
  const canConvert = !isLoading && !isFetchingRate && !!exchangeRate;

  return (
    <CenterDialog
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={t('currency.conversion')}
      dismissOnBackdrop={!isLoading}
      iconName="swap-horizontal-outline"
      iconBg={v2.brandSoft}
      iconColor={v2.brand}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('common.cancel')} onPress={onClose} disabled={isLoading} />
          <DialogPrimaryBtn
            label={isLoading ? t('currency.converting') : t('currency.convert')}
            onPress={onConfirm}
            isLoading={isLoading}
            disabled={!canConvert}
          />
        </DialogButtonRow>
      }
    >
      <View style={{ gap: 14 }}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 16, paddingVertical: 8,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: v2.fontDisplay, fontWeight: '700',
                fontStyle: 'italic', fontSize: 28, color: v2.brand, letterSpacing: -0.4,
              }}
            >
              {fromCurrency.symbol}
            </Text>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 2 }}>
              {fromCurrency.code}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color={v2.inkSubtle} />
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: v2.fontDisplay, fontWeight: '700',
                fontStyle: 'italic', fontSize: 28, color: v2.brand, letterSpacing: -0.4,
              }}
            >
              {toCurrency.symbol}
            </Text>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 2 }}>
              {toCurrency.code}
            </Text>
          </View>
        </View>

        {isFetchingRate ? (
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, paddingVertical: 6,
            }}
          >
            <ActivityIndicator size="small" color={v2.brand} />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle }}>
              {t('currency.fetchingRate')}
            </Text>
          </View>
        ) : exchangeRate ? (
          <View
            style={{
              padding: 12, borderRadius: 12,
              backgroundColor: v2.bgRaised,
            }}
          >
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                letterSpacing: 1.2, textTransform: 'uppercase',
                color: v2.inkSubtle, textAlign: 'center', marginBottom: 4,
              }}
            >
              {t('currency.currentRate')}
            </Text>
            <Text
              style={{
                fontFamily: v2.fontDisplay, fontWeight: '700',
                fontSize: 14, color: v2.ink, textAlign: 'center',
                fontVariant: ['tabular-nums'],
              }}
            >
              1 {fromCurrency.code} = {exchangeRate.toFixed(6)} {toCurrency.code}
            </Text>
            <Text
              style={{
                marginTop: 4, fontFamily: v2.fontUI, fontSize: 11,
                color: v2.inkSubtle, textAlign: 'center',
              }}
            >
              {t('currency.example')} 100,000 {fromCurrency.code} → {(100000 * exchangeRate).toFixed(2)} {toCurrency.code}
            </Text>
          </View>
        ) : null}

        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle,
            textAlign: 'center', lineHeight: 16,
          }}
        >
          {t('currency.convertInfo', { from: fromCurrency.name, to: toCurrency.name })}
        </Text>

        {error ? (
          <View
            style={{
              padding: 10, borderRadius: 10,
              backgroundColor: v2.badSoft,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}
          >
            <Ionicons name="alert-circle-outline" size={16} color={v2.bad} />
            <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.bad }}>
              {t(error)}
            </Text>
          </View>
        ) : null}
      </View>
    </CenterDialog>
  );
}
