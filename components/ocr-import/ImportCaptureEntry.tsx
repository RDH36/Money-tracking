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
import { takeTicketPhoto } from './entry/takePhoto';

type EntryAction = 'gallery' | 'camera';

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

/** Carte « Importer depuis une capture » (écran d'ajout) : galerie, ou photo d'un ticket. */
export function ImportCaptureEntry() {
  const v2 = useV2();
  const { t } = useTranslation();
  const [error, setError] = useState<'pick' | 'camera' | 'cameraDenied' | null>(null);
  const [pending, setPending] = useState<EntryAction | null>(null);
  const intro = useCaptureIntro();

  if (!OCR_IMPORT_ENABLED || !isOcrAvailable) return null;

  const run = async (action: EntryAction) => {
    setError(null);
    try {
      if (action === 'gallery') {
        openCaptureImport(await pickCaptures());
        return;
      }
      const photo = await takeTicketPhoto();
      if ('denied' in photo) setError('cameraDenied');
      else openCaptureImport(photo.uris);
    } catch (err) {
      console.warn('Image picker failed:', err);
      setError(action === 'gallery' ? 'pick' : 'camera');
    }
  };

  const onPress = (action: EntryAction) => {
    if (intro.seen) run(action);
    else setPending(action);
  };

  const continueFromIntro = () => {
    const action = pending ?? 'gallery';
    setPending(null);
    intro.markSeen();
    run(action);
  };

  const actions: { action: EntryAction; icon: 'camera-outline' | 'images-outline'; label: string }[] = [
    { action: 'camera', icon: 'camera-outline', label: t('ocrImport.takePhoto') },
    { action: 'gallery', icon: 'images-outline', label: t('ocrImport.pickGallery') },
  ];

  return (
    <View style={{ marginTop: 14 }}>
      <View
        style={{
          backgroundColor: v2.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: v2.hairline,
          paddingVertical: 12, paddingHorizontal: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 34, height: 34, borderRadius: 10, backgroundColor: v2.brandTint,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="scan-outline" size={17} color={v2.brand} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}>
              {t('ocrImport.entryTitle')}
            </Text>
            <Text style={{ marginTop: 1, fontFamily: v2.fontUIRegular, fontSize: 11, color: v2.inkMuted }}>
              {t('ocrImport.entrySub')}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
          {actions.map((a) => (
            <Pressable
              key={a.action}
              onPress={() => onPress(a.action)}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={{
                flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8,
                borderRadius: 12, borderWidth: 1, borderColor: v2.hairlineStrong,
                backgroundColor: v2.bgBase, paddingHorizontal: 10, paddingVertical: 8,
              }}
            >
              <Ionicons name={a.icon} size={18} color={v2.brand} />
              <Text numberOfLines={2} style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.ink }}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {error ? (
        <Text style={{ marginTop: 6, fontFamily: v2.fontUI, fontSize: 11, color: v2.bad }}>
          {t(error === 'pick' ? 'ocrImport.pickError' : error === 'camera' ? 'ocrImport.cameraError' : 'ocrImport.cameraDenied')}
        </Text>
      ) : null}
      <CaptureIntroSheet
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onContinue={continueFromIntro}
        continueLabel={t(pending === 'camera' ? 'ocrImport.intro.takePhoto' : 'ocrImport.intro.pick')}
      />
    </View>
  );
}
