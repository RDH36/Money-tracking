import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';

interface SettingRowProps {
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  rightText?: string;
  external?: boolean;
  isLast?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
}

export function SettingRow({
  label,
  sublabel,
  onPress,
  rightElement,
  rightText,
  external = false,
  isLast = false,
  leftIcon,
  leftIconColor,
}: SettingRowProps) {
  const effectiveScheme = useEffectiveColorScheme();
  const chevronColor = effectiveScheme === 'dark' ? '#48484A' : '#C7C7CC';
  const iconBg = leftIconColor ? `${leftIconColor}15` : undefined;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <HStack
        className={`px-4 py-3.5 justify-between items-center ${!isLast ? 'border-b border-outline-100' : ''}`}
      >
        <HStack className="flex-1 items-center" space="md">
          {leftIcon && (
            <View
              className="w-8 h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: iconBg }}
            >
              <Ionicons name={leftIcon} size={18} color={leftIconColor || '#6B7280'} />
            </View>
          )}
          <VStack className="flex-1">
            <Text className="text-typography-900">{label}</Text>
            {sublabel && <Text className="text-typography-500 text-xs">{sublabel}</Text>}
          </VStack>
        </HStack>
        <HStack className="items-center" space="sm">
          {rightText && <Text className="text-typography-500">{rightText}</Text>}
          {rightElement}
          {onPress && !rightElement && (
            <Ionicons name={external ? "open-outline" : "chevron-forward"} size={18} color={chevronColor} />
          )}
        </HStack>
      </HStack>
    </Pressable>
  );
}
