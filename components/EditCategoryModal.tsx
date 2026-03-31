import { useState, useEffect } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text as RNText } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertDialog, AlertDialogBackdrop, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { GhostButton, PrimaryButton, DangerButton } from '@/components/premium';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/types';

const CATEGORY_ICONS = [
  'fast-food', 'car', 'bag', 'document-text', 'medical', 'game-controller',
  'school', 'cube', 'home', 'gift', 'airplane', 'cafe',
];

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB',
  '#2ECC71', '#F39C12', '#1ABC9C', '#95A5A6',
  '#E74C3C', '#8E44AD', '#16A085', '#D35400',
];

interface EditCategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (id: string, params: { name?: string; icon?: string; color?: string; budget_limit?: number | null }) => Promise<boolean>;
  onSaveComplete?: () => void;
  onDelete?: (category: Category) => void;
}

export function EditCategoryModal({ isOpen, category, onClose, onSave, onSaveComplete, onDelete }: EditCategoryModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('cube');
  const [color, setColor] = useState('#3498DB');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || 'cube');
      setColor(category.color || '#3498DB');
      setBudgetLimit(category.budget_limit ? String(category.budget_limit / 100) : '');
    }
  }, [category]);

  const handleSave = async () => {
    if (!category || !name.trim()) return;
    setIsSaving(true);
    const parsedBudget = budgetLimit.trim() ? parseInt(budgetLimit.replace(/\s/g, ''), 10) * 100 : null;
    await onSave(category.id, {
      name: name.trim(), icon, color,
      budget_limit: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : null,
    });
    setIsSaving(false);
    onClose();
    onSaveComplete?.();
  };

  if (!category) return null;
  const isCustom = category.is_default === 0;

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <RNText className="font-display text-display-md text-content-primary">
            {t('budget.editCategory')}
          </RNText>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={20} style={{ maxHeight: 400 }}>
            <View className="gap-4">
              <View className="gap-2">
                <RNText className="font-body-bold text-body-md text-content-primary">{t('category.name')}</RNText>
                <View className="rounded-xl bg-bg-raised px-4 py-3">
                  <TextInput placeholder={t('category.namePlaceholder')} value={name} onChangeText={setName}
                    className="font-body-regular text-body-md text-content-primary" placeholderTextColor="#8E8EA0" />
                </View>
              </View>

              <View className="gap-2">
                <RNText className="font-body-bold text-body-md text-content-primary">{t('category.icon')}</RNText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-3">
                    {CATEGORY_ICONS.map((ic) => (
                      <Pressable key={ic} onPress={() => setIcon(ic)}>
                        <View className={cn('w-12 h-12 rounded-xl items-center justify-center', icon !== ic && 'bg-bg-raised')}
                          style={icon === ic ? { backgroundColor: `${color}20` } : undefined}>
                          <Ionicons name={ic as keyof typeof Ionicons.glyphMap} size={24} color={icon === ic ? color : '#8E8EA0'} />
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
                      <View className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: color === c ? '#FFF' : 'transparent' }}>
                        {color === c && <Ionicons name="checkmark" size={20} color="#FFF" />}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <RNText className="font-body-bold text-body-md text-content-primary">{t('budget.budgetOptional')}</RNText>
                <View className="rounded-xl bg-bg-raised px-4 py-3 flex-row items-center">
                  <TextInput placeholder={t('budget.budgetPlaceholder')} value={budgetLimit} onChangeText={setBudgetLimit}
                    keyboardType="numeric" className="font-body-regular text-body-md text-content-primary flex-1" placeholderTextColor="#8E8EA0" />
                  <RNText className="text-content-tertiary text-sm ml-2">Ar</RNText>
                </View>
              </View>

              {isCustom && onDelete && (
                <Pressable onPress={() => { onClose(); onDelete(category); }} className="flex-row items-center gap-2 py-2">
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <RNText className="text-[#EF4444] font-body-bold text-body-md">{t('budget.deleteCategory')}</RNText>
                </Pressable>
              )}
            </View>
          </KeyboardAwareScrollView>
        </AlertDialogBody>
        <AlertDialogFooter>
          <GhostButton label={t('common.cancel')} onPress={onClose} disabled={isSaving} compact />
          <PrimaryButton label={isSaving ? '...' : t('common.save')} onPress={handleSave} disabled={!name.trim() || isSaving} compact />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
