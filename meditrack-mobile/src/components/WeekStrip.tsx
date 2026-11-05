import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const LONG_DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

type Props = {
  // Siete fechas en formato YYYY-MM-DD
  days: string[];
  selected: string;
  today: string;
  // Fechas con alguna toma o cita
  marked?: string[];
  onSelect: (dateKey: string) => void;
};

export function WeekStrip({ days, selected, today, marked = [], onSelect }: Props) {
  const { largeFont } = useTheme();
  const big = largeFont ? 2 : 0;

  return (
    <View className="flex-row gap-1" accessibilityRole="tablist">
      {days.map((dateKey) => {
        const date = new Date(`${dateKey}T00:00:00`);
        const isSelected = dateKey === selected;
        const isToday = dateKey === today;
        const hasEvents = marked.includes(dateKey);

        return (
          <Pressable
            key={dateKey}
            onPress={() => onSelect(dateKey)}
            accessibilityRole="tab"
            aria-selected={isSelected}
            accessibilityLabel={`${isToday ? 'Hoy, ' : ''}${LONG_DAYS[date.getDay()]} ${date.getDate()}${hasEvents ? ', con registros' : ''}`}
            className={`min-h-[76px] flex-1 items-center justify-center rounded-2xl border-2 ${
              isSelected
                ? 'border-[#0369A1] bg-[#0369A1] dark:border-[#7DD3FC] dark:bg-[#7DD3FC]'
                : isToday
                  ? 'border-[#0369A1] bg-white dark:border-[#7DD3FC] dark:bg-[#1E293B]'
                  : 'border-[#BFDBFE] bg-white dark:border-[#334155] dark:bg-[#1E293B]'
            }`}
          >
            <Text
              className={`font-semibold ${isSelected ? 'text-white dark:text-[#0F172A]' : 'text-[#3E5468] dark:text-[#CBD5E1]'}`}
              style={{ fontSize: 16 + big }}
            >
              {SHORT_DAYS[date.getDay()]}
            </Text>
            <Text
              className={`font-extrabold ${isSelected ? 'text-white dark:text-[#0F172A]' : 'text-[#102A43] dark:text-[#F1F5F9]'}`}
              style={{ fontSize: 22 + big }}
            >
              {date.getDate()}
            </Text>
            <View
              className={`mt-1 h-2 w-2 rounded-full ${
                !hasEvents ? 'bg-transparent' : isSelected ? 'bg-white dark:bg-[#0F172A]' : 'bg-[#0369A1] dark:bg-[#7DD3FC]'
              }`}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
