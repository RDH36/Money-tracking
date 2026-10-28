import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { OperationKind } from '@/lib/ocr';

const KINDS: OperationKind[] = ['expense', 'income', 'transfer'];

interface KindSegmentProps {
  value: OperationKind;
  onChange: (kind: OperationKind) => void;
}

export function KindSegment({ value, onChange }: KindSegmentProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row', backgroundColor: v2.bgRaised, borderRadius: 12, padding: 3, gap: 3,
      }}
    >
      {KINDS.map((kind) => {
        const active = kind === value;
        return (
          <Pressable
            key={kind}
            onPress={() => onChange(kind)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center',
              backgroundColor: active ? v2.bgSurface : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 12, fontWeight: active ? '700' : '600',
                color: active ? v2.ink : v2.inkMuted,
              }}
            >
              {t(`ocrImport.edit.${kind}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
