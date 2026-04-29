import { useEffect, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useV2 } from '@/constants/designTokensV2';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  overline?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxHeightPct?: number;
  scrollable?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function BottomSheet({
  isOpen,
  onClose,
  title,
  overline,
  children,
  footer,
  maxHeightPct = 78,
  scrollable = true,
}: BottomSheetProps) {
  const v2 = useV2();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  useEffect(() => {
    if (isOpen) {
      // Reset to off-screen *before* mounting so the Modal opens with the sheet
      // at the bottom — otherwise withTiming starts on the UI thread before the
      // native Modal is presented, and the slide-in looks clipped/janky.
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;
      setMounted(true);
      const id = requestAnimationFrame(() => {
        translateY.value = withTiming(0, { duration: 260 });
        backdropOpacity.value = withTiming(1, { duration: 220 });
      });
      return () => cancelAnimationFrame(id);
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const baseMaxHeight = SCREEN_HEIGHT * (maxHeightPct / 100);
  // When keyboard is open we don't need the bottom safe-area padding nor the
  // footer padding below the buttons — the keyboard itself replaces them. So
  // lift the sheet by keyboardHeight + (insets.bottom + footerPad) to close
  // the gap between buttons and keyboard top. footerPad = 24 (CTA padding).
  const kbCompensation = insets.bottom + 24;

  const sheetStyle = useAnimatedStyle(() => {
    const ty = keyboardHeight.value < 0
      ? keyboardHeight.value + kbCompensation
      : 0;
    return {
      transform: [{ translateY: translateY.value + ty }],
      maxHeight: baseMaxHeight + ty,
    };
  });
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const Body: any = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {
        contentContainerStyle: { padding: 20, paddingTop: 8 },
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: { padding: 20, paddingTop: 8 } };

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: v2.bgSurface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderColor: v2.hairlineStrong,
              paddingBottom: insets.bottom,
              shadowColor: '#000',
              shadowOpacity: 0.4,
              shadowRadius: 32,
              shadowOffset: { width: 0, height: -12 },
              elevation: 24,
            },
            sheetStyle,
          ]}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: v2.hairlineStrong,
              }}
            />
          </View>

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              {overline ? (
                <Text
                  style={{
                    fontFamily: v2.fontUI,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: v2.inkSubtle,
                    marginBottom: 2,
                  }}
                >
                  {overline}
                </Text>
              ) : null}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: v2.fontDisplay,
                  fontWeight: '700',
                  fontSize: 20,
                  color: v2.ink,
                  letterSpacing: -0.4,
                }}
              >
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={6}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: v2.bgRaised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={14} color={v2.ink} />
            </Pressable>
          </View>

          <Body {...bodyProps}>{children}</Body>

          {footer ? (
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 24,
                borderTopWidth: 1,
                borderTopColor: v2.hairline,
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
