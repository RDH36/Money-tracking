import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface TapExpense {
  id: string;
  label: string;
  category: string;
  icon: IoniconName;
  color: string;
  amount: number;
}

interface ExpenseTapListProps {
  expenses: TapExpense[];
  tapped: Set<string>;
  onTap: (id: string) => void;
  fmt: (n: number) => string;
  label: string;
}

export function ExpenseTapList({ expenses, tapped, onTap, fmt, label }: ExpenseTapListProps) {
  const v2 = useV2();
  return (
    <View>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          marginBottom: 8,
        }}
      >
        <Ionicons name="sparkles-outline" size={11} color={v2.inkSubtle} />
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.4, textTransform: 'uppercase',
            color: v2.inkSubtle,
          }}
        >
          {label}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        {expenses.map((e) => {
          const isAdded = tapped.has(e.id);
          return (
            <Pressable
              key={e.id}
              onPress={() => !isAdded && onTap(e.id)}
              disabled={isAdded}
              style={{
                paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14,
                backgroundColor: isAdded ? v2.bgRaised : v2.bgSurface,
                borderWidth: 1, borderColor: v2.hairline,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                opacity: isAdded ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: e.color + '22',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name={e.icon} size={16} color={e.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600',
                    color: v2.ink,
                  }}
                >
                  {e.label}
                </Text>
                <Text
                  style={{
                    marginTop: 1, fontFamily: v2.fontUI, fontSize: 11,
                    color: v2.inkSubtle,
                  }}
                >
                  {e.category}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700',
                  color: isAdded ? v2.inkSubtle : v2.bad,
                  fontVariant: ['tabular-nums'],
                }}
              >
                −{fmt(e.amount)}
              </Text>
              {isAdded ? (
                <View
                  style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: v2.brand,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={11} color={v2.inkOnDark} />
                </View>
              ) : (
                <View
                  style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: v2.hairlineStrong,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
