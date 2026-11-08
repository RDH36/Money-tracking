import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

interface AddSaveButtonProps {
  label: string;
  disabled: boolean;
  onPress: () => void;
}

/** Bouton « Enregistrer » de l'écran d'ajout — extrait tel quel de add.tsx. */
export function AddSaveButton({ label, disabled, onPress }: AddSaveButtonProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        marginTop: 20, backgroundColor: v2.bgInk, borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: disabled ? 0.5 : 1,
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
      }}
    >
      <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                      color: v2.inkOnDark, letterSpacing: 0.3 }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={v2.inkOnDark} />
    </Pressable>
  );
}
