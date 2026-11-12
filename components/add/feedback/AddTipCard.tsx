import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { TxMode } from '../ModeToggle';
import type { TxType } from '../TypePills';
import { addTipFor } from './addTips';

interface AddTipCardProps {
  /** Clé i18n du conseil tiré par useTips('add'). */
  tip: string | null;
  mode: TxMode;
  type: TxType;
}

/** Astuce sous le montant (écran d'ajout) : seulement un conseil adapté à l'onglet actif. */
export function AddTipCard({ tip, mode, type }: AddTipCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const shown = addTipFor(tip, mode, type);
  if (!shown) return null;
  return (
    <View style={{ marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: v2.bgSurface,
                    borderWidth: 1, borderColor: v2.hairline, flexDirection: 'row',
                    alignItems: 'center', gap: 8 }}>
      <Ionicons name="bulb-outline" size={14} color={v2.brand} />
      <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted }}>
        {t(shown)}
      </Text>
    </View>
  );
}
