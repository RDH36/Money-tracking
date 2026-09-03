import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { VerdictStatus } from '@/lib/analysis/verdict';
import { alpha, statusTone } from './tone';

interface StatusPillProps {
  status: VerdictStatus;
  /** Sur la carte sombre : teinte claire, fond translucide, liseré. */
  onDark?: boolean;
}

/** Pastille « Dans le vert / Serré / Dans le rouge » : icône + texte. */
export function StatusPill({ status, onDark = false }: StatusPillProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const tone = statusTone(v2, status);
  const fg = onDark ? tone.onDark : tone.color;

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: onDark ? 6 : 5, borderRadius: 999,
        backgroundColor: onDark ? alpha(tone.color, 0.18) : tone.soft,
        borderWidth: onDark ? 1 : 0, borderColor: alpha(tone.color, 0.35),
        paddingVertical: onDark ? 5 : 4, paddingHorizontal: onDark ? 10 : 9,
        alignSelf: 'flex-start',
      }}
    >
      <Ionicons name={tone.icon} size={onDark ? 12 : 11} color={fg} />
      <Text style={{ fontFamily: v2.fontUI, fontSize: onDark ? 12 : 11, fontWeight: '600', color: fg }}>
        {t(tone.labelKey)}
      </Text>
    </View>
  );
}
