import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, Easing,
} from 'react-native-reanimated';
import { useV2 } from '@/constants/designTokensV2';

interface CenterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body?: string | ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  variant?: 'neutral' | 'warning' | 'danger' | 'success' | 'celebration';
  footer?: ReactNode;
  children?: ReactNode;
  showClose?: boolean;
  dismissOnBackdrop?: boolean;
  maxWidth?: number;
}

export function CenterDialog({
  isOpen, onClose, title, body, iconName, iconColor, iconBg,
  variant = 'neutral', footer, children,
  showClose = true, dismissOnBackdrop = true, maxWidth = 420,
}: CenterDialogProps) {
  const v2 = useV2();
  const [mounted, setMounted] = useState(false);
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      scale.value = 0.92;
      opacity.value = 0;
      backdrop.value = 0;
      setMounted(true);
      requestAnimationFrame(() => {
        backdrop.value = withTiming(1, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 });
      scale.value = withTiming(0.94, {
        duration: 180, easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value, transform: [{ scale: scale.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  const accent =
    variant === 'danger' ? v2.bad
    : variant === 'warning' ? v2.warn
    : variant === 'success' ? v2.good
    : variant === 'celebration' ? v2.brand
    : v2.brand;
  const iconBgFinal = iconBg ?? (
    variant === 'danger' ? v2.badSoft
    : variant === 'warning' ? v2.warnSoft
    : variant === 'success' ? v2.goodSoft
    : variant === 'celebration' ? v2.brandSoft
    : v2.bgRaised
  );
  const iconColorFinal = iconColor ?? accent;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
            onPress={dismissOnBackdrop ? onClose : undefined}
          />
        </Animated.View>

        <Animated.View
          style={[
            cardStyle,
            {
              width: '100%', maxWidth,
              backgroundColor: v2.bgSurface,
              borderRadius: 20,
              borderWidth: 1, borderColor: v2.hairlineStrong,
              shadowColor: '#000', shadowOpacity: 0.35,
              shadowRadius: 32, shadowOffset: { width: 0, height: 12 },
              elevation: 16,
            },
          ]}
        >
          {showClose ? (
            <Pressable
              onPress={onClose}
              hitSlop={6}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 2,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: v2.bgRaised,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={14} color={v2.ink} />
            </Pressable>
          ) : null}

          <View style={{ padding: 20, paddingTop: 24 }}>
            {iconName ? (
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: iconBgFinal,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name={iconName} size={26} color={iconColorFinal} />
                </View>
              </View>
            ) : null}
            <Text
              style={{
                textAlign: iconName ? 'center' : 'left',
                fontFamily: v2.fontDisplay, fontWeight: '700',
                fontSize: 20, color: v2.ink, letterSpacing: -0.4, lineHeight: 24,
              }}
            >
              {title}
            </Text>
            {body ? (
              typeof body === 'string' ? (
                <Text
                  style={{
                    textAlign: iconName ? 'center' : 'left',
                    marginTop: 8, fontFamily: v2.fontUI, fontSize: 13,
                    color: v2.inkMuted, lineHeight: 19,
                  }}
                >
                  {body}
                </Text>
              ) : (
                <View style={{ marginTop: 8 }}>{body}</View>
              )
            ) : null}
            {children ? <View style={{ marginTop: 12 }}>{children}</View> : null}
          </View>

          {footer ? (
            <View
              style={{
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: 1, borderTopColor: v2.hairline,
              }}
            >
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
