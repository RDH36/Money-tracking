import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EaseView } from 'react-native-ease';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface DoneViewProps {
  count: number;
  onView: () => void;
  onImportMore: () => void;
}

/** Fin de l'import : coche animée, puis « Voir » ou « Importer d'autres captures ». */
export function DoneView({ count, onView, onImportMore }: DoneViewProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <EaseView
        initialAnimate={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 180, mass: 1 }}
        style={{
          width: 76, height: 76, borderRadius: 24, backgroundColor: v2.goodSoft,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="checkmark" size={38} color={v2.good} />
      </EaseView>

      <EaseView
        initialAnimate={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 260, easing: 'easeOut', delay: 120 }}
        style={{ alignItems: 'center', alignSelf: 'stretch' }}
      >
        <Text
          style={{
            marginTop: 20, fontFamily: v2.fontDisplay, fontSize: 22, fontWeight: '700',
            color: v2.ink, textAlign: 'center', letterSpacing: -0.4,
          }}
        >
          {t('ocrImport.doneTitle', { count })}
        </Text>
        <Text
          style={{
            marginTop: 6, fontFamily: v2.fontUIRegular, fontSize: 14, lineHeight: 20,
            color: v2.inkMuted, textAlign: 'center',
          }}
        >
          {t('ocrImport.doneBody', { count })}
        </Text>

        <Pressable
          onPress={onView}
          style={{
            marginTop: 26, alignSelf: 'stretch', backgroundColor: v2.bgInk, borderRadius: 14,
            borderWidth: 1, borderColor: v2.hairlineStrong,
            paddingVertical: 15, alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.inkOnDark }}>
            {t('ocrImport.view')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onImportMore}
          style={{
            marginTop: 10, alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: v2.hairlineStrong,
            paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Ionicons name="scan-outline" size={15} color={v2.ink} />
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}>
            {t('ocrImport.importMore')}
          </Text>
        </Pressable>
      </EaseView>
    </View>
  );
}
