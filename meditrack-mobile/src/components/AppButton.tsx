import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Button, ButtonSpinner, ButtonText } from './ui/button';

type Tone = 'primary' | 'success' | 'warning' | 'indigo';

// Todos los colores cumplen contraste AA con su texto
const TONES: Record<Tone, { button: string; text: string; icon: { light: string; dark: string } }> = {
  primary: {
    button: 'bg-[#0369A1] data-[hover=true]:bg-[#075985] data-[active=true]:bg-[#0C4A6E]',
    text: 'text-white data-[hover=true]:text-white data-[active=true]:text-white',
    icon: { light: '#FFFFFF', dark: '#FFFFFF' },
  },
  success: {
    button:
      'bg-[#166534] data-[hover=true]:bg-[#14532D] data-[active=true]:bg-[#14532D] dark:bg-[#86EFAC] dark:data-[hover=true]:bg-[#4ADE80] dark:data-[active=true]:bg-[#4ADE80]',
    text: 'text-white data-[hover=true]:text-white data-[active=true]:text-white dark:text-[#0F172A] dark:data-[hover=true]:text-[#0F172A] dark:data-[active=true]:text-[#0F172A]',
    icon: { light: '#FFFFFF', dark: '#0F172A' },
  },
  indigo: {
    button: 'bg-[#4338CA] data-[hover=true]:bg-[#3730A3] data-[active=true]:bg-[#312E81]',
    text: 'text-white data-[hover=true]:text-white data-[active=true]:text-white',
    icon: { light: '#FFFFFF', dark: '#FFFFFF' },
  },
  warning: {
    button: 'bg-[#B45309] data-[hover=true]:bg-[#92400E] data-[active=true]:bg-[#78350F]',
    text: 'text-white data-[hover=true]:text-white data-[active=true]:text-white',
    icon: { light: '#FFFFFF', dark: '#FFFFFF' },
  },
};

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Botón principal de la app, sobre el Button de Gluestack: alto, legible y con respuesta al presionarlo. */
export function AppButton({ label, onPress, tone = 'primary', icon, loading, disabled, className = '' }: Props) {
  const { isDarkMode, largeFont } = useTheme();
  const colors = TONES[tone];
  const iconColor = isDarkMode ? colors.icon.dark : colors.icon.light;

  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - pressed.value * 0.04 }] }));

  return (
    <Animated.View style={animatedStyle} className={className}>
      <Button
        size="xl"
        className={`h-auto min-h-[60px] gap-2 rounded-2xl px-3 py-3 ${colors.button}`}
        onPress={onPress}
        isDisabled={disabled || loading}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
        }}
      >
        {loading ? (
          <ButtonSpinner color={iconColor} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={26} color={iconColor} /> : null}
            <ButtonText className={`text-center font-extrabold ${colors.text}`} style={{ fontSize: 20 + (largeFont ? 4 : 0) }}>
              {label}
            </ButtonText>
          </>
        )}
      </Button>
    </Animated.View>
  );
}
