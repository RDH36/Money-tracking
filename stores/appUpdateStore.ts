import { create } from 'zustand';
import { posthog } from '@/lib/posthog';
import { manualResult, updateReducer, type UpdateEvent, type UpdatePhase } from '@/lib/appUpdate/policy';
import { updateModule } from '@/modules/mitsitsy-update';

type Source = 'auto' | 'manual';

interface AppUpdateState {
  phase: UpdatePhase;
  /** Fenêtre « Mise à jour disponible » ouverte (vérification automatique). */
  promptOpen: boolean;
  /** Fenêtre « Prête : redémarrer » fermée par « Plus tard » pour cette session. */
  readyDismissed: boolean;
  progress: number;
  /** Vérifie auprès de Play. Renvoie la phase obtenue. */
  check: (source: Source) => Promise<UpdatePhase>;
  accept: () => Promise<void>;
  dismiss: () => void;
  dismissReady: () => void;
  restart: () => Promise<void>;
}

let subscribed = false;

/**
 * État partagé de la mise à jour flexible : la fenêtre (onglets), la
 * vérification automatique (accueil) et la ligne Réglages lisent le même état.
 */
export const useAppUpdateStore = create<AppUpdateState>((set, get) => {
  const send = (event: UpdateEvent) => set((s) => ({ phase: updateReducer(s.phase, event) }));

  const subscribe = () => {
    if (subscribed || !updateModule) return;
    subscribed = true;
    updateModule.addListener('onFlowResult', ({ accepted }) => {
      if (accepted) return;
      posthog.capture('app_update_dismissed', { via: 'play' });
      send({ type: 'declined' });
    });
    updateModule.addListener('onState', ({ status, bytes, total }) => {
      if (status === 'downloading' || status === 'pending') {
        set({ progress: total > 0 ? bytes / total : 0 });
        send({ type: 'progress' });
      } else if (status === 'downloaded') {
        if (get().phase !== 'downloaded') posthog.capture('app_update_downloaded');
        set({ progress: 1, readyDismissed: false });
        send({ type: 'downloaded' });
      } else if (status === 'failed' || status === 'canceled') {
        send({ type: 'failed' });
      } else if (status === 'installed') {
        set({ phase: 'latest' });
      }
    });
  };

  const start = async () => {
    if (!updateModule) return;
    subscribe();
    try {
      const started = await updateModule.startFlexibleUpdate();
      if (!started) send({ type: 'error' });
    } catch (err) {
      console.warn('In-app update failed to start:', err);
      send({ type: 'error' });
    }
  };

  return {
    phase: 'idle',
    promptOpen: false,
    readyDismissed: false,
    progress: 0,
    check: async (source) => {
      // Déjà téléchargée : la ligne Réglages rouvre la fenêtre « Prête : redémarrer ».
      if (source === 'manual' && get().phase === 'downloaded') {
        set({ readyDismissed: false });
        return 'downloaded';
      }
      send({ type: 'check' });
      if (!updateModule) {
        send({ type: 'error' });
      } else {
        subscribe();
        try {
          send({ type: 'checked', info: await updateModule.checkUpdate() });
        } catch (err) {
          // info, pas warn : sans Play Store (Huawei) l'échec est attendu, pas de bandeau jaune en dev.
          console.info('In-app update check failed:', err);
          send({ type: 'error' });
        }
      }
      const phase = get().phase;
      if (source === 'manual') {
        posthog.capture('app_update_check_manual', { result: manualResult(phase) });
        // Vérification demandée : on lance directement la mise à jour flexible.
        if (phase === 'available') {
          posthog.capture('app_update_available', { source });
          posthog.capture('app_update_accepted', { source });
          await start();
        }
      } else if (phase === 'available') {
        posthog.capture('app_update_available', { source });
        set({ promptOpen: true });
      }
      return get().phase;
    },
    accept: async () => {
      posthog.capture('app_update_accepted', { source: 'auto' });
      set({ promptOpen: false });
      await start();
    },
    dismiss: () => {
      posthog.capture('app_update_dismissed', { via: 'later' });
      set({ promptOpen: false });
    },
    dismissReady: () => set({ readyDismissed: true }),
    restart: async () => {
      posthog.capture('app_update_installed_restart');
      set({ readyDismissed: true });
      try {
        await updateModule?.completeUpdate();
      } catch (err) {
        console.warn('In-app update install failed:', err);
      }
    },
  };
});
