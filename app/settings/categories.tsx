import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text as RNText } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import { useTheme } from '@/contexts';
import { useCategories } from '@/hooks';
import { useAccounts } from '@/hooks';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';
import { SettingSection } from '@/components/settings';
import { AddCategoryModal } from '@/components/AddCategoryModal';
import { EditCategoryModal } from '@/components/EditCategoryModal';
import { DeleteCategoryDialog } from '@/components/DeleteCategoryDialog';
import { getCategoryDisplayName } from '@/constants/categories';
import { LockedFeatureModal, type LockedFeature } from '@/components/LockedFeatureModal';
import type { Category } from '@/types';

export default function CategoriesBudgetsPage() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const monthLabel = new Date().toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  const posthog = usePostHog();
  const { formatMoney } = useAccounts();
  const {
    expenseCategories, customCategories, refresh, createCategory,
    updateCategory, deleteCategoryWithOptions, getTransactionCount,
    canCreateCategory, customCategoriesCount, maxCustomCategories,
  } = useCategories();

  const [showAdd, setShowAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteTransactionCount, setDeleteTransactionCount] = useState(0);
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const baseCategories = expenseCategories.filter((c) => c.is_default === 1);

  const handleDelete = async (category: Category) => {
    const count = await getTransactionCount(category.id);
    setDeleteTransactionCount(count);
    setDeleteTarget(category);
  };

  const handleDeleteConfirm = async (action: 'move' | 'delete' | 'simple') => {
    if (!deleteTarget) return;
    if (action === 'simple') {
      await deleteCategoryWithOptions(deleteTarget.id, 'delete');
    } else {
      await deleteCategoryWithOptions(deleteTarget.id, action);
    }
    posthog.capture('category_deleted');
    setDeleteTarget(null);
  };

  const formatBudget = (cat: Category) => {
    if (!cat.budget_limit) return t('budget.unlimited');
    return `${formatMoney(cat.budget_limit)}${t('budget.perMonth')}`;
  };

  const getDisplayName = (cat: Category) => getCategoryDisplayName(cat.id, cat.name, t);

  const renderCategoryRow = (cat: Category, isLast: boolean) => (
    <Pressable key={cat.id} onPress={() => setEditCategory(cat)}>
      <View className={`flex-row items-center px-4 py-3.5 ${!isLast ? 'border-b border-outline-100' : ''}`}>
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${cat.color || '#95A5A6'}20` }}>
          <Ionicons name={(cat.icon || 'cube') as keyof typeof Ionicons.glyphMap} size={20}
            color={cat.color || '#95A5A6'} />
        </View>
        <RNText className="font-body-bold text-body-md text-content-primary flex-1">
          {getDisplayName(cat)}
        </RNText>
        <RNText className="text-content-tertiary text-sm mr-2">{formatBudget(cat)}</RNText>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </View>
    </Pressable>
  );

  return (
    <SettingsPageWrapper title={t('settings.categoriesBudgets')}>
      <View className="mx-4 mb-3 p-3 rounded-xl bg-bg-raised flex-row items-start gap-2">
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
        <RNText className="flex-1 font-body-regular text-body-sm text-content-secondary capitalize">
          {t('budget.currentMonthBudgetsInfo', { month: monthLabel })}
        </RNText>
      </View>

      <SettingSection title={t('budget.baseCategories')}>
        {baseCategories.map((cat, i) => renderCategoryRow(cat, i === baseCategories.length - 1))}
      </SettingSection>

      <SettingSection title={`${t('budget.customCategories')} (${customCategoriesCount}/${maxCustomCategories})`}>
        {customCategories.map((cat, i) => renderCategoryRow(cat, i === customCategories.length - 1))}
        <Pressable
          onPress={() => {
            if (canCreateCategory) setShowAdd(true);
            else setLockedFeature('category');
          }}
        >
          <View className="flex-row items-center px-4 py-3.5 gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center border-2 border-dashed"
              style={{ borderColor: theme.colors.primary }}
            >
              <Ionicons name="add" size={20} color={theme.colors.primary} />
            </View>
            <RNText
              className="font-body-bold text-body-md"
              style={{ color: theme.colors.primary }}
            >
              {t('budget.newCategory')}
            </RNText>
          </View>
        </Pressable>
      </SettingSection>

      <AddCategoryModal isOpen={showAdd} onClose={() => setShowAdd(false)}
        onCreateCategory={async (params) => {
          const result = await createCategory(params);
          if (result.success) { posthog.capture('category_created'); setShowAdd(false); }
          return result;
        }}
        canCreateCategory={canCreateCategory} customCategoriesCount={customCategoriesCount} maxCustomCategories={maxCustomCategories} />

      <EditCategoryModal isOpen={!!editCategory} category={editCategory} onClose={() => setEditCategory(null)}
        onSave={updateCategory} onSaveComplete={refresh} onDelete={editCategory && editCategory.id !== 'other' ? handleDelete : undefined} />

      <DeleteCategoryDialog isOpen={!!deleteTarget} category={deleteTarget} transactionCount={deleteTransactionCount}
        onClose={() => setDeleteTarget(null)}
        onMoveToOther={() => handleDeleteConfirm('move')}
        onDeleteAll={() => handleDeleteConfirm('delete')}
        onDeleteSimple={() => handleDeleteConfirm('simple')} />

      <LockedFeatureModal
        feature={lockedFeature}
        onClose={() => setLockedFeature(null)}
      />
    </SettingsPageWrapper>
  );
}
