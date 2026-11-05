import type { TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Input, InputField } from './ui/input';

/** Campo de texto de los formularios, sobre el Input de Gluestack. */
export function FormInput(props: TextInputProps) {
  const { isDarkMode, largeFont } = useTheme();

  return (
    <Input
      size="xl"
      className="mb-4 h-14 rounded-2xl border-2 border-[#64748B] bg-white data-[focus=true]:border-[#0369A1] data-[hover=true]:border-[#64748B] dark:border-[#94A3B8] dark:bg-[#0F172A] dark:data-[focus=true]:border-[#7DD3FC]"
    >
      <InputField
        {...props}
        placeholderTextColor={isDarkMode ? '#CBD5E1' : '#3E5468'}
        className="text-[#102A43] placeholder:text-[#3E5468] dark:text-[#F1F5F9] dark:placeholder:text-[#CBD5E1]"
        style={{ fontSize: 18 + (largeFont ? 4 : 0) }}
      />
    </Input>
  );
}
