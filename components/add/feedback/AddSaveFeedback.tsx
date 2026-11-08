import { View, Text } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface AddSaveFeedbackProps {
  successText: string | null;
  errorText: string | null;
}

/** Messages succès / erreur de l'écran d'ajout — extraits tels quels de add.tsx. */
export function AddSaveFeedback({ successText, errorText }: AddSaveFeedbackProps) {
  const v2 = useV2();
  return (
    <>
      {successText && (
        <View style={{ marginTop: 12, backgroundColor: v2.goodSoft, padding: 12, borderRadius: 12 }}>
          <Text style={{ color: v2.good, fontFamily: v2.fontUI, textAlign: 'center' }}>
            {successText}
          </Text>
        </View>
      )}
      {errorText && (
        <View style={{ marginTop: 12, backgroundColor: v2.badSoft, padding: 12, borderRadius: 12 }}>
          <Text style={{ color: v2.bad, fontFamily: v2.fontUI, textAlign: 'center' }}>{errorText}</Text>
        </View>
      )}
    </>
  );
}
