import { Platform, StyleSheet, View } from 'react-native';

type Props = {
  colors: string[];
  // Por defecto va en diagonal; vertical de arriba hacia abajo
  vertical?: boolean;
};

/** Fondo degradado: ocupa todo su contenedor, que debe tener overflow hidden si es redondeado. */
export function Gradient({ colors, vertical }: Props) {
  const image = `linear-gradient(${vertical ? 180 : 135}deg, ${colors.join(', ')})`;
  // Lo dibuja la propia vista, así siempre mide lo mismo que su contenedor
  const background = Platform.OS === 'web' ? ({ backgroundImage: image } as object) : { experimental_backgroundImage: image };

  return <View testID="gradient" pointerEvents="none" style={[StyleSheet.absoluteFill, background]} />;
}
