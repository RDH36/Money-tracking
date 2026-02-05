import { Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import type { Category } from '@/types';

interface CategoriesSectionProps {
  categories: Category[];
  customCount: number;
  maxCustom: number;
  onAdd: () => void;
  onDelete: (category: Category) => void;
}

export function CategoriesSection({
  categories,
  customCount,
  maxCustom,
  onAdd,
  onDelete,
}: CategoriesSectionProps) {
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const colors = getDarkModeColors(effectiveScheme === 'dark');

  return (
    <Box className="mb-6">
      <HStack className="justify-between items-center px-4 mb-2">
        <Text className="text-typography-500 text-xs font-medium uppercase tracking-wide">
          Catégories personnalisées ({customCount}/{maxCustom})
        </Text>
        <Pressable onPress={onAdd}>
          <Box
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Ionicons name="add" size={16} color={colors.cardBg} />
          </Box>
        </Pressable>
      </HStack>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onLongPress={cat.is_default === 0 ? () => onDelete(cat) : undefined}
          >
            <Box
              className="w-16 h-20 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${cat.color || colors.textMuted}15` }}
            >
              <Box
                className="w-10 h-10 rounded-full items-center justify-center mb-1"
                style={{ backgroundColor: cat.color || colors.textMuted }}
              >
                <Ionicons
                  name={(cat.icon || 'cube') as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={colors.cardBg}
                />
              </Box>
              <Text
                className="text-[10px] font-medium text-center"
                style={{ color: cat.color || colors.textMuted }}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
              {cat.is_default === 0 && (
                <Box className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
                  <Ionicons name="close" size={10} color={colors.cardBg} />
                </Box>
              )}
            </Box>
          </Pressable>
        ))}
        <Pressable onPress={onAdd}>
          <Box
            className="w-16 h-20 rounded-xl items-center justify-center border-2 border-dashed"
            style={{ borderColor: theme.colors.primary + '50' }}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </Box>
        </Pressable>
      </ScrollView>
    </Box>
  );
}
