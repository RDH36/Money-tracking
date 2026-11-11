import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { OCR_IMPORT_ENABLED, PLUS_ENABLED } from '@/constants/app';
import { isOcrAvailable } from '@/modules/mitsitsy-ocr';
import { usePostHog } from 'posthog-react-native';
import { useCaptureIntro } from '@/hooks/ocr/useCaptureIntro';
import { useImportTutorial } from '@/hooks/ocr/useImportTutorial';
import { useOcrQuota } from '@/hooks/premium/useOcrQuota';
import { PlusActivatedDialog, RedeemCodeSheet } from '@/components/plus';
import type { License } from '@/lib/premium';
import type { TutorialSource } from '@/lib/ocr/tutorial';
import { CaptureIntroSheet } from './entry/CaptureIntroSheet';
import { ImportTutorialModal, type TutorialEnd } from './entry/ImportTutorialModal';
import { QuotaReachedSheet } from './entry/QuotaReachedSheet';
import { BetaBadge } from './BetaBadge';

type EntryAction = 'gallery' | 'camera';
export type ImportSource = EntryAction | 'share';

/**
 * Ouvre l'écran de vérification de l'import pour ces captures. `replace` :
 * l'écran d'import est déjà affiché (nouveau partage, « Importer d'autres
 * captures ») → on le remplace au lieu d'en empiler un second.
 */
export function openCaptureImport(uris: string[], replace = false, source: ImportSource = 'gallery') {
  if (uris.length === 0) return;
  const route = { pathname: '/import/capture' as const, params: { uris: JSON.stringify(uris), source } };
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
  const [pending, setPending] = useState<EntryAction | null>(null);
  const intro = useCaptureIntro();
  const quota = useOcrQuota();
  const posthog = usePostHog();
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [activated, setActivated] = useState<License | null>(null);
  const tutorial = useImportTutorial();
  // Tuto vidéo affiché : `then` = bouton d'import qui l'a déclenché (première ouverture).
  const [tuto, setTuto] = useState<{ source: TutorialSource; then: EntryAction | null } | null>(null);

  if (!OCR_IMPORT_ENABLED || !isOcrAvailable) return null;

  // L'écran d'import s'ouvre d'abord (cadre stable) et lance lui-même le sélecteur.
  const run = (action: EntryAction) => {
    router.push({ pathname: '/import/capture', params: { pick: action } });
  };

  const start = (action: EntryAction) => {
    if (intro.seen) run(action);
    else setPending(action);
  };

  const showTutorial = (source: TutorialSource, then: EntryAction | null) => {
    tutorial.markSeen();
    posthog.capture('import_tutorial_shown', { source });
    setTuto({ source, then });
  };

  // Fin du tuto (passé, terminé ou illisible) : l'import demandé reprend son cours habituel.
  const onTutorialEnd = (how: TutorialEnd, seconds: number) => {
    const shown = tuto;
    setTuto(null);
    if (!shown) return;
    if (how === 'skipped') posthog.capture('import_tutorial_skipped', { source: shown.source, seconds });
    else if (how === 'completed') posthog.capture('import_tutorial_completed', { source: shown.source });
    if (shown.then) start(shown.then);
  };

  const onPress = (action: EntryAction) => {
    if (quota.loaded && quota.remaining <= 0) {
      posthog.capture('ocr_quota_reached', { limit: quota.limit, reads_used: quota.used, surface: 'entry' });
      setQuotaOpen(true);
    } else if (tutorial.shouldAutoPlay) showTutorial('auto', action);
    else start(action);
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ flexShrink: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}>
                {t('ocrImport.entryTitle')}
              </Text>
              <BetaBadge />
            </View>
            <Text style={{ marginTop: 1, fontFamily: v2.fontUIRegular, fontSize: 11, color: v2.inkMuted }}>
              {t('ocrImport.entrySub')}
            </Text>
            {quota.loaded && (PLUS_ENABLED || !quota.unlimited) ? (
              <Text style={{ marginTop: 3, fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: v2.brand }}>
                {quota.unlimited
                  ? t('ocrImport.quota.unlimited')
                  : t('ocrImport.quota.counter', { used: Math.min(quota.used, quota.limit), limit: quota.limit })}
              </Text>
            ) : null}
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
        <Pressable
          onPress={() => showTutorial('manual', null)}
          accessibilityRole="button"
          accessibilityLabel={t('ocrImport.tutorial.watch')}
          style={{
            alignSelf: 'center', minHeight: 44, marginTop: 2, marginBottom: -10, paddingHorizontal: 12,
            flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Ionicons name="play-circle-outline" size={16} color={v2.inkMuted} />
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.inkMuted }}>
            {t('ocrImport.tutorial.watch')}
          </Text>
        </Pressable>
      </View>
      <ImportTutorialModal visible={tuto !== null} onEnd={onTutorialEnd} />
      <CaptureIntroSheet
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onContinue={continueFromIntro}
        continueLabel={t(pending === 'camera' ? 'ocrImport.intro.takePhoto' : 'ocrImport.intro.pick')}
      />
      <QuotaReachedSheet
        isOpen={quotaOpen}
        limit={quota.limit}
        resetsOn={quota.resetsOn}
        onManual={() => {
          posthog.capture('ocr_manual_fallback');
          setQuotaOpen(false);
        }}
        onEnterCode={() => {
          setQuotaOpen(false);
          setCodeOpen(true);
        }}
        onClose={() => setQuotaOpen(false)}
      />
      {PLUS_ENABLED ? (
        <>
          <RedeemCodeSheet
            isOpen={codeOpen}
            onClose={() => setCodeOpen(false)}
            onActivated={(l) => {
              setCodeOpen(false);
              setActivated(l);
            }}
          />
          <PlusActivatedDialog license={activated} onClose={() => setActivated(null)} />
        </>
      ) : null}
    </View>
  );
}
