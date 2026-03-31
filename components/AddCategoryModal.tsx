import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text as RNText } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { GhostButton, PrimaryButton } from '@/components/premium';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const CATEGORY_ICONS = [
  { icon: 'fast-food', label: 'Nourriture' },
  { icon: 'car', label: 'Transport' },
  { icon: 'bag', label: 'Shopping' },
  { icon: 'document-text', label: 'Factures' },
  { icon: 'medical', label: 'Santé' },
  { icon: 'game-controller', label: 'Loisirs' },
  { icon: 'school', label: 'Éducation' },
  { icon: 'cube', label: 'Autre' },
  { icon: 'home', label: 'Maison' },
  { icon: 'gift', label: 'Cadeaux' },
  { icon: 'airplane', label: 'Voyage' },
  { icon: 'cafe', label: 'Café' },
];

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB',
  '#2ECC71', '#F39C12', '#1ABC9C', '#95A5A6',
  '#E74C3C', '#8E44AD', '#16A085', '#D35400',
];

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCategory: (params: {
    name: string;
    icon: string;
    color: string;
    budget_limit?: number | null;
  }) => Promise<{ success: boolean; limitReached: boolean }>;
  canCreateCategory: boolean;
  customCategoriesCount: number;
  maxCustomCategories: number;
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onCreateCategory,
  canCreateCategory,
  customCategoriesCount,
  maxCustomCategories,
}: AddCategoryModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('cube');
  const [color, setColor] = useState('#3498DB');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setName('');
    setIcon('cube');
    setColor('#3498DB');
    setBudgetLimit('');
  };

  const handleCreate = async () => {
    if (!name.trim() || !canCreateCategory) return;
    setIsCreating(true);
    const parsedBudget = budgetLimit.trim() ? parseInt(budgetLimit.replace(/\s/g, ''), 10) * 100 : null;
    const result = await onCreateCategory({
      name: name.trim(),
      icon,
      color,
      budget_limit: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : null,
    });
    if (result.success) {
      resetForm();
      onClose();
    }
    setIsCreating(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!canCreateCategory) {
    return (
      <AlertDialog isOpen={isOpen} onClose={handleClose}>
        <AlertDialogBackdrop />
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-error/10">
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
              </View>
              <RNText className="font-display text-display-md text-content-primary">{t('category.limitReached')}</RNText>
            </View>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-3 mb-4">
            <RNText className="font-body-regular text-body-md text-content-secondary">
              {t('category.limitMessage', { max: maxCustomCategories })}
            </RNText>
          </AlertDialogBody>
          <AlertDialogFooter>
            <PrimaryButton label={t('common.understood')} onPress={handleClose} compact />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog isOpen={isOpen} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <View className="flex-row items-center justify-between w-full">
            <RNText className="font-display text-display-md text-content-primary">{t('category.new')}</RNText>
            <RNText className="text-content-tertiary text-sm">
              {customCategoriesCount}/{maxCustomCategories}
            </RNText>
          </View>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={20}
            style={{ maxHeight: 400 }}
          >
            <View className="gap-4">
              <View className="gap-2">
                <RNText className="font-body-bold text-body-md text-content-primary">{t('category.name')}</RNText>
                <View className="rounded-xl bg-bg-raised px-4 py-3">
                  <TextInput
                    placeholder={t('category.namePlaceholder')}
                    value={name}
                    onChangeText={setName}
                    className="font-body-regular text-body-md text-content-primary"
                    placeholderTextColor="#8E8EA0"
                  />
                </View>
              </View>

              <View className="gap-2">
                <RNText className="font-body-bold text-body-md text-content-primary">{t('category.icon')}</RNText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-3">
                    {CATEGORY_ICONS.map((item) => (
                      <Pressable key={item.icon} onPress={() => setIcon(item.icon)}>
                        <View
                          className={cn('w-12 h-12 rounded-xl items-center justify-center', icon !== item.icon && 'bg-bg-raised')}
                          style={icon === item.icon ? { backgroundColor: `${color}20` } : undefined}
                        >
                          <Ionicons
                            name={item.icon as keyof typeof Ionicons.glyphMap}
                            size={24}
                            color={icon === item.icon ? color : '#8E8EA0'}
                          />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="gap-2">
                <RNText className="font-body-bold text-body-md text-content-primary">{t('category.color')}</RNText>
                <View className="flex-row flex-wrap gap-3">
                  {CATEGORY_COLORS.map((c) => (
                    <Pressable key={c} onPress={() => setColor(c)}>
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: c,
                          borderWidth: color === c ? 3 : 0,
                          borderColor: color === c ? '#FFF' : 'transparent',
                        }}
                      >
                        {color === c && (
                          <Ionicons name="checkmark" size={20} color="#FFF" />
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <RNText className="font-body-bold text-body-md text-content-primary">{t('budget.budgetOptional')}</RNText>
                <View className="rounded-xl bg-bg-raised px-4 py-3 flex-row items-center">
                  <TextInput
                    placeholder={t('budget.budgetPlaceholder')}
                    value={budgetLimit}
                    onChangeText={setBudgetLimit}
                    keyboardType="numeric"
                    className="font-body-regular text-body-md text-content-primary flex-1"
                    placeholderTextColor="#8E8EA0"
                  />
                  <RNText className="text-content-tertiary text-sm ml-2">Ar</RNText>
                </View>
              </View>

              <View
                className="p-3 rounded-xl items-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: color }}
                >
                  <Ionicons
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={28}
                    color="#FFF"
                  />
                </View>
                <RNText className="font-body-bold text-body-md" style={{ color }}>
                  {name || t('category.preview')}
                </RNText>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </AlertDialogBody>
        <AlertDialogFooter>
          <GhostButton label={t('common.cancel')} onPress={handleClose} disabled={isCreating} compact />
          <PrimaryButton
            label={isCreating ? t('category.creating') : t('category.create')}
            onPress={handleCreate}
            disabled={!name.trim() || isCreating}
            compact
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
