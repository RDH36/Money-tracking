import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';

export type TxMode = 'transaction' | 'transfer';

interface ModeToggleProps {
  mode: TxMode;
  onChange: (m: TxMode) => void;
  transactionLabel: string;
  transferLabel: string;
}

export function ModeToggle({
  mode,
  onChange,
  transactionLabel,
  transferLabel,
}: ModeToggleProps) {
  const v2 = useV2();
  return (
    <View
      style={{
        backgroundColor: v2.bgRaised,
        borderRadius: 12,
        padding: 4,
        flexDirection: 'row',
      }}
    >
      <Segment
        v2={v2}
        active={mode === 'transaction'}
        icon="receipt-outline"
        label={transactionLabel}
        onPress={() => onChange('transaction')}
      />
      <Segment
        v2={v2}
        active={mode === 'transfer'}
        icon="swap-horizontal"
        label={transferLabel}
        onPress={() => onChange('transfer')}
      />
    </View>
  );
}

interface SegmentProps {
  v2: V2Tokens;
  active: boolean;
  icon: 'receipt-outline' | 'swap-horizontal';
  label: string;
  onPress: () => void;
}

function Segment({ v2, active, icon, label, onPress }: SegmentProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: active ? v2.bgInk : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? v2.inkOnDark : v2.inkSubtle}
      />
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 12,
          fontWeight: active ? '700' : '600',
          color: active ? v2.inkOnDark : v2.inkSubtle,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
