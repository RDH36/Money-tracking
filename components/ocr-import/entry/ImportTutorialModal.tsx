import { useCallback, useEffect, useRef } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { tutorialLang, type TutorialLang } from '@/lib/ocr/tutorial';

// Vidéos embarquées dans l'app (lecture hors ligne), 720×1280.
const VIDEOS: Record<TutorialLang, number> = {
  fr: require('@/assets/videos/tuto-import-fr.mp4'),
  en: require('@/assets/videos/tuto-import-en.mp4'),
};

/** Façon dont le tuto s'est terminé (`error` : vidéo illisible, on rend la main). */
export type TutorialEnd = 'skipped' | 'completed' | 'error';

interface ImportTutorialModalProps {
  visible: boolean;
  /** `seconds` : position de lecture au moment de la fermeture. */
  onEnd: (how: TutorialEnd, seconds: number) => void;
}

/**
 * Tuto vidéo de l'import, en plein écran : lecture automatique avec le son,
 * « Passer » toujours visible, fermeture à la fin. Le lecteur n'existe que
 * pendant l'affichage (libéré à la fermeture : le son s'arrête tout de suite).
 */
export function ImportTutorialModal({ visible, onEnd }: ImportTutorialModalProps) {
  return visible ? <TutorialPlayer onEnd={onEnd} /> : null;
}

function TutorialPlayer({ onEnd }: Pick<ImportTutorialModalProps, 'onEnd'>) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const done = useRef(false);
  const player = useVideoPlayer(VIDEOS[tutorialLang(i18n.language)], (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  const finish = useCallback(
    (how: TutorialEnd) => {
      if (done.current) return;
      done.current = true;
      let seconds = 0;
      try {
        seconds = Math.round(player.currentTime);
        player.pause();
      } catch {
        // Lecteur déjà libéré : rien à arrêter.
      }
      onEnd(how, seconds);
    },
    [player, onEnd]
  );

  useEventListener(player, 'playToEnd', () => finish('completed'));
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') finish('error');
  });

  // L'app passée en arrière-plan met la vidéo en pause : elle reprend au retour.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !done.current) player.play();
    });
    return () => sub.remove();
  }, [player]);

  return (
    <Modal visible animationType="none" statusBarTranslucent onRequestClose={() => finish('skipped')}>
      <View style={styles.root}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
          surfaceType="textureView"
        />
        <Pressable
          onPress={() => finish('skipped')}
          accessibilityRole="button"
          accessibilityLabel={t('ocrImport.tutorial.skip')}
          hitSlop={8}
          style={[styles.skip, { top: insets.top + 8 }]}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
            {t('ocrImport.tutorial.skip')}
          </Text>
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Fond noir dans les deux thèmes : bandes neutres autour de la vidéo verticale.
  root: { flex: 1, backgroundColor: '#000000' },
  skip: {
    position: 'absolute', right: 16, minHeight: 44, minWidth: 44,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 16, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)',
  },
});
