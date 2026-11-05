import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import type { DoseStatus } from '../lib/doseLog';
import { AppButton } from './AppButton';
import { Gradient } from './Gradient';
import './motion';

// El estado siempre se comunica con ícono y texto, nunca solo con el color
const STATUS: Record<DoseStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; className: string }> = {
  upcoming: { label: 'Próxima toma', icon: 'time', className: 'bg-[#E0F2FE] dark:bg-[#0C4A6E]' },
  due: { label: 'Es hora de tomarla', icon: 'alarm', className: 'bg-[#DCFCE7] dark:bg-[#14532D]' },
  late: { label: 'Toma atrasada', icon: 'warning', className: 'bg-[#FEF3C7] dark:bg-[#713F12]' },
};

type Props = {
  medication: string;
  dose: string;
  time: string;
  status: DoseStatus;
  photoUri?: string;
  // Solo cuando es de un perfil a cargo, por ejemplo "Tomás"
  forWhom?: string;
  // Más medicamentos a la misma hora
  position?: number;
  total?: number;
  onTaken: () => void;
  onSkip: () => void;
};

export function NextDoseCard({ medication, dose, time, status, photoUri, forWhom, position, total, onTaken, onSkip }: Props) {
  const { isDarkMode, largeFont } = useTheme();
  const { label, icon, className } = STATUS[status];
  const textColor = isDarkMode ? '#F1F5F9' : '#102A43';
  const big = largeFont ? 4 : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      className="mb-4 rounded-3xl border-2 border-[#BFDBFE] bg-white p-6 shadow-soft-2 dark:border-[#075985] dark:bg-[#1E293B]"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className={`shrink flex-row items-center gap-2 rounded-full px-4 py-2 ${className}`}>
          <Ionicons name={icon} size={22} color={textColor} />
          <Text className="shrink font-bold text-[#102A43] dark:text-[#F1F5F9]" style={{ fontSize: 17 + big }}>
            {label}
          </Text>
        </View>
        {total && total > 1 ? (
          <Text className="font-semibold text-[#3E5468] dark:text-[#CBD5E1]" style={{ fontSize: 17 + big }}>
            {position} de {total}
          </Text>
        ) : null}
      </View>

      <View className="mt-5 flex-row items-center gap-4">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#E0F2FE] dark:bg-[#0C4A6E]">
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="h-full w-full" accessibilityIgnoresInvertColors />
          ) : (
            <>
              <Gradient colors={['#0B4F8A', '#0369A1']} />
              <Ionicons name="medical" size={44} color="#FFF" />
            </>
          )}
        </View>
        <View className="flex-1">
          {forWhom ? (
            <Text className="font-semibold text-[#3E5468] dark:text-[#CBD5E1]" style={{ fontSize: 17 + big }}>
              Para {forWhom}
            </Text>
          ) : null}
          <Text className="font-extrabold text-[#102A43] dark:text-[#F1F5F9]" numberOfLines={3} style={{ fontSize: 28 + big, lineHeight: 34 + big }}>
            {medication}
          </Text>
          <Text className="mt-1 font-semibold text-[#3E5468] dark:text-[#CBD5E1]" style={{ fontSize: 20 + big }}>
            {dose}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row items-center gap-2">
        <Ionicons name="time-outline" size={30} color={textColor} />
        <Text className="font-extrabold text-[#102A43] dark:text-[#F1F5F9]" style={{ fontSize: 36 + big }}>
          {time}
        </Text>
      </View>

      <AppButton className="mt-5" tone="success" icon="checkmark-circle" label="Ya me la tomé" onPress={onTaken} />

      <Pressable className="mt-2 min-h-[56px] items-center justify-center" onPress={onSkip} accessibilityRole="button">
        <Text className="font-semibold text-[#3E5468] underline dark:text-[#CBD5E1]" style={{ fontSize: 18 + big }}>
          Ahora no
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** Lo que muestra la tarjeta cuando no queda ninguna toma por hoy. */
export function NoDoseCard({ hasMedications }: { hasMedications: boolean }) {
  const { isDarkMode, largeFont } = useTheme();
  const big = largeFont ? 4 : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      className="mb-4 flex-row items-center gap-4 rounded-3xl border-2 border-[#BFDBFE] bg-white p-6 shadow-soft-2 dark:border-[#075985] dark:bg-[#1E293B]"
    >
      <Ionicons
        name={hasMedications ? 'checkmark-circle' : 'medical'}
        size={48}
        color={isDarkMode ? '#7DD3FC' : '#0369A1'}
      />
      <View className="flex-1">
        <Text className="font-extrabold text-[#102A43] dark:text-[#F1F5F9]" style={{ fontSize: 22 + big }}>
          {hasMedications ? 'Por hoy, todo listo' : 'Aún no hay medicamentos'}
        </Text>
        <Text className="mt-1 text-[#3E5468] dark:text-[#CBD5E1]" style={{ fontSize: 18 + big }}>
          {hasMedications ? 'No te queda ninguna toma pendiente.' : 'Agrégalos con el botón de abajo.'}
        </Text>
      </View>
    </Animated.View>
  );
}
