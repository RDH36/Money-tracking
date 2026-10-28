import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { OCR_IMPORT_ENABLED } from '@/constants/app';
import { isOcrAvailable } from '@/modules/mitsitsy-ocr';
import { useCaptureIntro } from '@/hooks/ocr/useCaptureIntro';
import { CaptureIntroSheet } from './entry/CaptureIntroSheet';

/**
 * Ouvre l'écran de vérification de l'import pour ces captures. `replace` :
 * l'écran d'import est déjà affiché (nouveau partage, « Importer d'autres
 * captures ») → on le remplace au lieu d'en empiler un second.
 */
export function openCaptureImport(uris: string[], replace = false) {
  if (uris.length === 0) return;
  const route = { pathname: '/import/capture' as const, params: { uris: JSON.stringify(uris) } };
  if (replace) router.replace(route);
  else router.push(route);
}

/** Galerie, plusieurs captures possibles. Liste vide si l'utilisateur annule. */
export async function pickCaptures(): Promise<string[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
  });
  return res.canceled ? [] : res.assets.map((a) => a.uri);
}

/** Carte « Importer depuis une capture » (écran d'ajout), choix dans la galerie. */
export function ImportCaptureEntry() {
  const v2 = useV2();
  const { t } = useTranslation();
  const [error, setError] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const intro = useCaptureIntro();

  if (!OCR_IMPORT_ENABLED || !isOcrAvailable) return null;

  const pick = async () => {
    setError(false);
    try {
      openCaptureImport(await pickCaptures());
    } catch (err) {
      console.warn('Image picker failed:', err);
      setError(true);
    }
  };

  const onPress = () => {
    if (intro.seen) pick();
    else setIntroOpen(true);
  };

  const continueFromIntro = () => {
    setIntroOpen(false);
    intro.markSeen();
    pick();
  };

  return (
    <View style={{ marginTop: 14 }}>
      <Pressable
        onPress={onPress}
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
      <CaptureIntroSheet isOpen={introOpen} onClose={() => setIntroOpen(false)} onContinue={continueFromIntro} />
    </View>
  );
}
