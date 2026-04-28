import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface IncomeCategoryCardProps {
  incomeCategory?: Category | null;
  label: string;
  sectionLabel: string;
}

export function IncomeCategoryCard({
  incomeCategory,
  label,
  sectionLabel,
}: IncomeCategoryCardProps) {
  const v2 = useV2();
  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
          marginBottom: 8,
        }}
      >
        {sectionLabel}
      </Text>
      <View
        style={{
          backgroundColor: v2.goodSoft,
          borderRadius: 14,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: v2.good,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={(incomeCategory?.icon as IoniconName) ?? 'trending-up'}
            size={16}
            color="#fff"
          />
        </View>
        <Text
          style={{
            fontFamily: v2.fontUI,
            fontSize: 12,
            fontWeight: '700',
            color: v2.good,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
