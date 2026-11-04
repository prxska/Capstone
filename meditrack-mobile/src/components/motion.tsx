import { useEffect, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScaleButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  activeOpacity?: number;
};

/** Botón que se hunde levemente al presionarlo. Reanimated respeta "reducir movimiento" del teléfono. */
export function ScaleButton({ style, children, activeOpacity: _activeOpacity, onPressIn, onPressOut, ...rest }: ScaleButtonProps) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
    opacity: 1 - pressed.value * 0.15,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Latido continuo, para el ícono de la alarma. */
export function Pulse({ children }: { children: ReactNode }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 350 }), withTiming(1, { duration: 350 })),
      -1
    );
    return () => cancelAnimation(scale);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

/** Sube y baja suavemente, para indicar que hay más contenido abajo. */
export function Bob({ children }: { children: ReactNode }) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(withTiming(4, { duration: 600 }), -1, true);
    return () => cancelAnimation(offset);
  }, [offset]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
