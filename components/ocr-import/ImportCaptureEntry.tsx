import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { OCR_IMPORT_ENABLED } from '@/constants/app';
import { isOcrAvailable } from '@/modules/mitsitsy-ocr';

/** Ouvre l'écran de vérification de l'import pour ces captures. */
export function openCaptureImport(uris: string[]) {
  if (uris.length === 0) return;
  router.push({ pathname: '/import/capture', params: { uris: JSON.stringify(uris) } });
}

/** Carte « Importer depuis une capture » (écran d'ajout), choix dans la galerie. */
export function ImportCaptureEntry() {
  const v2 = useV2();
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  if (!OCR_IMPORT_ENABLED || !isOcrAvailable) return null;

  const pick = async () => {
    setError(false);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 1,
      });
      if (!res.canceled) openCaptureImport(res.assets.map((a) => a.uri));
    } catch (err) {
      console.warn('Image picker failed:', err);
      setError(true);
    }
  };

  return (
    <View style={{ marginTop: 14 }}>
      <Pressable
        onPress={pick}
        accessibilityRole="button"
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          backgroundColor: v2.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: v2.hairline,
          paddingVertical: 11, paddingHorizontal: 12,
        }}
      >
        <View
          style={{
            width: 34, height: 34, borderRadius: 10, backgroundColor: v2.brandTint,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="scan-outline" size={17} color={v2.brand} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}>
            {t('ocrImport.entryTitle')}
          </Text>
          <Text numberOfLines={1} style={{ marginTop: 1, fontFamily: v2.fontUIRegular, fontSize: 11, color: v2.inkMuted }}>
            {t('ocrImport.entrySub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={v2.inkSubtle} />
      </Pressable>
      {error ? (
        <Text style={{ marginTop: 6, fontFamily: v2.fontUI, fontSize: 11, color: v2.bad }}>{t('ocrImport.pickError')}</Text>
      ) : null}
    </View>
  );
}
