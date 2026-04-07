import { Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { getCategoryDisplayName } from '@/constants/categories';
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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const colors = getDarkModeColors(effectiveScheme === 'dark');

  const getCategoryName = (cat: Category) => getCategoryDisplayName(cat.id, cat.name, t);

  return (
    <Box className="mb-6">
      <HStack className="justify-between items-center px-4 mb-2">
        <Text className="text-typography-500 text-xs font-medium uppercase tracking-wide">
          {t('settings.customCategories')} ({customCount}/{maxCustom})
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, gap: 10 }}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onLongPress={cat.is_default === 0 ? () => onDelete(cat) : undefined}
            style={{ overflow: 'visible' }}
          >
            <Box
              className="w-16 h-20 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${cat.color || colors.textMuted}15`, overflow: 'visible' }}
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
                {getCategoryName(cat)}
              </Text>
              {cat.is_default === 0 && (
                <Pressable
                  onPress={() => onDelete(cat)}
                  hitSlop={8}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center"
                >
                  <Ionicons name="close" size={10} color={colors.cardBg} />
                </Pressable>
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
