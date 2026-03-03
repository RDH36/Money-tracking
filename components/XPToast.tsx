import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface XPToastProps {
  xpAmount: number | null;
  onHide: () => void;
}

export function XPToast({ xpAmount, onHide }: XPToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (xpAmount === null) return;

    opacity.setValue(0);
    translateY.setValue(20);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
        ]).start(onHide);
      }, 1200);
    });
  }, [xpAmount]);

  if (xpAmount === null) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <Animated.Text style={styles.text}>+{xpAmount} XP</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
