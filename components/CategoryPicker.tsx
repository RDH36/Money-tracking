import { ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useTheme } from '@/contexts';
import type { Category } from '@/types';

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  const { theme } = useTheme();

  const handlePress = (id: string) => {
    if (selectedId === id) {
      onSelect(null);
    } else {
      onSelect(id);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
    >
      {categories.map((category) => {
        const isSelected = selectedId === category.id;
        const iconColor = category.color || '#95A5A6';
        return (
          <Pressable key={category.id} onPress={() => handlePress(category.id)}>
            <VStack
              className="items-center p-3 rounded-xl min-w-[80px] border-2"
              style={{
                backgroundColor: isSelected ? theme.colors.primaryLight : '#F5F5F5',
                borderColor: isSelected ? theme.colors.primary : 'transparent',
              }}
              space="xs"
            >
              <Box
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: iconColor + '20' }}
              >
                <Ionicons
                  name={(category.icon || 'cube') as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={iconColor}
                />
              </Box>
              <Text
                className="text-xs text-center"
                style={{
                  color: isSelected ? theme.colors.primary : '#666',
                  fontWeight: isSelected ? '600' : '400',
                }}
                numberOfLines={1}
              >
                {category.name}
              </Text>
            </VStack>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
