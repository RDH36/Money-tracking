import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';

export type TxType = 'expense' | 'income';

interface TypePillsProps {
  type: TxType;
  onChange: (t: TxType) => void;
  expenseLabel: string;
  incomeLabel: string;
}

export function TypePills({
  type,
  onChange,
  expenseLabel,
  incomeLabel,
}: TypePillsProps) {
  const v2 = useV2();
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
      <Pill
        v2={v2}
        active={type === 'expense'}
        icon="arrow-down"
        label={expenseLabel}
        tone="bad"
        onPress={() => onChange('expense')}
      />
      <Pill
        v2={v2}
        active={type === 'income'}
        icon="arrow-up"
        label={incomeLabel}
        tone="good"
        onPress={() => onChange('income')}
      />
    </View>
  );
}

interface PillProps {
  v2: V2Tokens;
  active: boolean;
  icon: 'arrow-down' | 'arrow-up';
  label: string;
  tone: 'bad' | 'good';
  onPress: () => void;
}

function Pill({ v2, active, icon, label, tone, onPress }: PillProps) {
  const accent = tone === 'bad' ? v2.bad : v2.good;
  const accentSoft = tone === 'bad' ? v2.badSoft : v2.goodSoft;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: active ? accentSoft : v2.bgRaised,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: active ? accent + '4D' : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={14} color={active ? accent : v2.inkSubtle} />
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 12,
          fontWeight: active ? '700' : '600',
          color: active ? accent : v2.inkSubtle,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
