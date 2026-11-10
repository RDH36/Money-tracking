import { useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { EaseView } from 'react-native-ease';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { pillState } from '@/lib/appUpdate/policy';
import { useAppUpdateStore } from '@/stores/appUpdateStore';

/** Hauteur de la barre d'onglets (hors inset) + dépassement du bouton +. */
const TAB_BAR = 60;
const PLUS_OVERFLOW = 34;

/**
 * Pastille flottante au-dessus des onglets : téléchargement de la mise à jour
 * en cours, puis « prête » si la fenêtre a été fermée par « Plus tard ».
 */
export function UpdateProgressPill() {
  const { t } = useTranslation();
  const v2 = useV2();
  const insets = useSafeAreaInsets();
  const state = useAppUpdateStore((s) => pillState(s.phase, s.readyDismissed, s.promptOpen));
  const progress = useAppUpdateStore((s) => s.progress);
  const [keyboard, setKeyboard] = useState(false);
  // Garde le dernier contenu pendant l'animation de disparition.
  const [shown, setShown] = useState<'downloading' | 'ready'>('downloading');
  if (state && state !== shown) setShown(state);
  const visible = state !== null && !keyboard;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const label = shown === 'ready'
    ? t('appUpdate.pillReady')
    : pct > 0 ? t('appUpdate.pillDownloadingPct', { pct }) : t('appUpdate.pillDownloading');

  const onPress = () => useAppUpdateStore.setState({ readyDismissed: false });

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: TAB_BAR + insets.bottom + PLUS_OVERFLOW, alignItems: 'center' }}
    >
      <EaseView
        pointerEvents={visible ? 'auto' : 'none'}
        animate={{ opacity: visible ? 1 : 0, translateY: visible ? 0 : 8 }}
        transition={{ type: 'timing', duration: 200 }}
      >
        <Pressable
          disabled={shown !== 'ready' || !visible}
          onPress={onPress}
          accessibilityRole={shown === 'ready' ? 'button' : 'progressbar'}
          accessibilityLabel={label}
          style={{
            backgroundColor: v2.bgSurface,
            borderColor: v2.hairlineStrong,
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            maxWidth: 320,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons
              name={shown === 'ready' ? 'checkmark-circle' : 'arrow-down-circle-outline'}
              size={16}
              color={shown === 'ready' ? v2.good : v2.brand}
            />
            <Text numberOfLines={1} style={{ color: v2.ink, fontFamily: v2.fontUI, fontSize: 13 }}>
              {label}
            </Text>
          </View>
          {shown === 'downloading' ? (
            <View style={{ height: 3, borderRadius: 2, backgroundColor: v2.brandSoft, marginTop: 6, overflow: 'hidden' }}>
              <View style={{ height: 3, width: `${pct}%`, backgroundColor: v2.brand }} />
            </View>
          ) : null}
        </Pressable>
      </EaseView>
    </View>
  );
}
