import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { safeIconName } from './safeIcon';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Icône d'un compte lue en base : repli si le nom n'existe pas dans Ionicons. */
export function accountIconName(icon: unknown, fallback: IoniconName = 'wallet'): IoniconName {
  return safeIconName(icon, Ionicons.glyphMap, fallback) as IoniconName;
}
