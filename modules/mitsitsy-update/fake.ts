import type { UpdateInfo } from '@/lib/appUpdate/policy';
import type { InstallState, UpdateModule } from './index';

type Listener = (payload: never) => void;

/**
 * Faux module (développement uniquement, voir index.ts) : « available » simule
 * une version plus récente → accord → téléchargement → téléchargé ; « latest »
 * répond « dernière version ». completeUpdate() fait comme si l'app redémarrait
 * sur la nouvelle version (plus rien de disponible ensuite).
 */
export function createFakeUpdateModule(mode: 'available' | 'latest'): UpdateModule {
  let installed = mode === 'latest';
  let downloaded = false;
  const listeners: Record<string, Set<Listener>> = { onState: new Set(), onFlowResult: new Set() };
  const emit = (event: string, payload: unknown) => {
    listeners[event]?.forEach((l) => (l as (p: unknown) => void)(payload));
  };
  const state = (status: string, bytes: number): InstallState => ({ status, bytes, total: 100 });

  return {
    async checkUpdate(): Promise<UpdateInfo> {
      await new Promise((r) => setTimeout(r, 400));
      return { available: !installed, versionCode: 999, stalenessDays: 3, flexibleAllowed: true, downloaded };
    },
    async startFlexibleUpdate() {
      if (installed) return false;
      setTimeout(() => emit('onFlowResult', { accepted: true }), 300);
      // ~8 s en paliers : laisse le temps de voir la pastille de progression.
      [0, 12, 25, 40, 55, 70, 85, 95].forEach((pct, i) => {
        setTimeout(() => emit('onState', state('downloading', pct)), 800 + i * 900);
      });
      setTimeout(() => {
        downloaded = true;
        emit('onState', state('downloaded', 100));
      }, 8000);
      return true;
    },
    async completeUpdate() {
      installed = true;
      downloaded = false;
      emit('onState', state('installed', 100));
    },
    addListener(event, listener) {
      listeners[event].add(listener as Listener);
      return { remove: () => listeners[event].delete(listener as Listener) };
    },
  };
}
