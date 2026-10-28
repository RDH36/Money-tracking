import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { CaptureExample } from '../entry/CaptureExample';

interface EmptyViewProps {
  /** notMcb : aucune capture reconnue ; noOps : écran MCB sans opération complète. */
  reason: 'notMcb' | 'noOps';
  onPickOther: () => void;
  onClose: () => void;
}

/** Rien à importer : ce qui ne va pas, le bon geste, et l'exemple de bonne capture. */
export function EmptyView({ reason, onPickOther, onClose }: EmptyViewProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24 }}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 56, height: 56, borderRadius: 18, backgroundColor: v2.warnSoft,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={reason === 'notMcb' ? 'image-outline' : 'swap-vertical'} size={26} color={v2.warn} />
        </View>
        <Text
          style={{
            marginTop: 14, fontFamily: v2.fontDisplay, fontSize: 20, fontWeight: '700',
            color: v2.ink, textAlign: 'center', letterSpacing: -0.4,
          }}
        >
          {t(`ocrImport.empty.${reason}Title`)}
        </Text>
        <Text
          style={{
            marginTop: 6, fontFamily: v2.fontUIRegular, fontSize: 14, lineHeight: 20,
            color: v2.inkMuted, textAlign: 'center',
          }}
        >
          {t(`ocrImport.empty.${reason}Body`)}
        </Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <CaptureExample />
      </View>

      <Pressable
        onPress={onPickOther}
        style={{
          marginTop: 24, backgroundColor: v2.bgInk, borderRadius: 14, paddingVertical: 15,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Ionicons name="images-outline" size={15} color={v2.inkOnDark} />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.inkOnDark }}>
          {t('ocrImport.pickOther')}
        </Text>
      </Pressable>
      <Pressable onPress={onClose} hitSlop={8} style={{ marginTop: 6, paddingVertical: 10, alignItems: 'center' }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.inkMuted }}>
          {t('ocrImport.finish')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
