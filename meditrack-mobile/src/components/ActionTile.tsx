import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Gradient } from './Gradient';
import { ScaleButton } from './motion';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: string[];
  shadowColor: string;
  onPress: () => void;
};

/** Botón grande de la barra inferior: degradado, con su ícono encima del texto. */
export function ActionTile({ label, icon, colors, shadowColor, onPress }: Props) {
  const { largeFont } = useTheme();

  return (
    <View style={[styles.shadow, { shadowColor }]}>
      <ScaleButton onPress={onPress} accessibilityLabel={label}>
        {/* El contenido se centra en una vista aparte de la que se anima */}
        <View style={styles.tile}>
          <Gradient colors={colors} />
          <View testID="action-tile-icon" style={styles.iconCircle}>
            <Ionicons name={icon} size={24} color="#FFF" />
          </View>
          <Text
            style={[styles.label, { fontSize: largeFont ? 22 : 19 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {label}
          </Text>
        </View>
      </ScaleButton>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    flex: 1,
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
      default: { shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    }),
  },
  tile: {
    minHeight: 92,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  label: { color: '#FFF', fontWeight: '800', textAlign: 'center' },
});
