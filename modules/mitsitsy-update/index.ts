import { requireOptionalNativeModule, type NativeModule } from 'expo';
import { selectUpdateModule, type UpdateInfo } from '@/lib/appUpdate/policy';
import { createFakeUpdateModule } from './fake';

export type InstallState = { status: string; bytes: number; total: number };

type UpdateEvents = {
  onState: (state: InstallState) => void;
  onFlowResult: (result: { accepted: boolean }) => void;
};

export interface UpdateModule {
  checkUpdate(): Promise<UpdateInfo>;
  startFlexibleUpdate(): Promise<boolean>;
  completeUpdate(): Promise<void>;
  addListener<E extends keyof UpdateEvents>(event: E, listener: UpdateEvents[E]): { remove: () => void };
}

declare class MitsitsyUpdateNative extends NativeModule<UpdateEvents> {
  checkUpdate(): Promise<UpdateInfo>;
  startFlexibleUpdate(): Promise<boolean>;
  completeUpdate(): Promise<void>;
}

// Android + build qui embarque le module. Null sur la .dev actuelle, iOS, web : « indisponible ».
const native = requireOptionalNativeModule<MitsitsyUpdateNative>('MitsitsyUpdate') as UpdateModule | null;

/**
 * Simulation pour la recette, en développement SEULEMENT :
 * EXPO_PUBLIC_FAKE_APP_UPDATE=available|latest au lancement de Metro.
 */
export const updateModule: UpdateModule | null = selectUpdateModule(
  native, __DEV__, process.env.EXPO_PUBLIC_FAKE_APP_UPDATE, createFakeUpdateModule,
);
