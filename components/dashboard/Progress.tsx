import { View } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface ProgressProps {
  value: number;
  height?: number;
  color: string;
  track?: string;
  thresholds?: number[];
}

export function Progress({
  value,
  height = 6,
  color,
  track,
  thresholds,
}: ProgressProps) {
  const v2 = useV2();
  const clamped = Math.max(0, Math.min(100, value));
  const trackBg = track ?? v2.hairline;

  return (
    <View
      style={{
        height,
        borderRadius: 999,
        backgroundColor: trackBg,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
      {thresholds?.map((pos) => (
        <View
          key={pos}
          style={{
            position: 'absolute',
            left: `${pos}%`,
            top: 0,
            bottom: 0,
            width: 1.5,
            backgroundColor: v2.bgSurface,
            borderLeftWidth: 0.5,
            borderRightWidth: 0.5,
            borderColor: v2.hairlineStrong,
          }}
        />
      ))}
    </View>
  );
}
