import { Children, isValidElement } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const baseStyle = {
  width: '100%' as const,
  minHeight: 48,
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderRadius: 12,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexDirection: 'row' as const,
  gap: 6,
};

export function DialogPrimaryBtn({ label, onPress, disabled, isLoading }: ButtonProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={{ ...baseStyle, backgroundColor: v2.bgInk, opacity: disabled || isLoading ? 0.5 : 1 }}
    >
      {isLoading ? <ActivityIndicator size="small" color={v2.inkOnDark} /> : null}
      <Text
        numberOfLines={1}
        style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DialogDangerBtn({ label, onPress, disabled, isLoading }: ButtonProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={{ ...baseStyle, backgroundColor: v2.bad, opacity: disabled || isLoading ? 0.5 : 1 }}
    >
      {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
      <Text
        numberOfLines={1}
        style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DialogGhostBtn({ label, onPress, disabled }: ButtonProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        ...baseStyle,
        borderWidth: 1, borderColor: v2.hairlineStrong,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface RowProps {
  children: React.ReactNode;
}

export function DialogButtonRow({ children }: RowProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {Children.map(children, (child) =>
        isValidElement(child) ? <View style={{ flex: 1 }}>{child}</View> : child
      )}
    </View>
  );
}

export function DialogButtonStack({ children }: RowProps) {
  return (
    <View style={{ gap: 8 }}>
      {children}
    </View>
  );
}
