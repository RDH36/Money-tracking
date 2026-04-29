import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CenterDialog } from '@/components/ui/CenterDialog';
import {
  DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn,
} from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type V2T = ReturnType<typeof useV2>;
const eyebrow = (v2: V2T) => ({
  fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700' as const,
  letterSpacing: 1.5, textTransform: 'uppercase' as const,
  color: v2.inkSubtle, marginBottom: 8,
});

const CATEGORY_ICONS: IoniconName[] = [
  'fast-food-outline', 'car-outline', 'bag-outline', 'document-text-outline',
  'medical-outline', 'game-controller-outline', 'school-outline', 'cube-outline',
  'home-outline', 'gift-outline', 'airplane-outline', 'cafe-outline',
];

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB', '#2ECC71', '#F39C12',
  '#1ABC9C', '#95A5A6', '#E74C3C', '#8E44AD', '#16A085', '#D35400',
];

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCategory: (params: {
    name: string; icon: string; color: string; budget_limit?: number | null;
  }) => Promise<{ success: boolean; limitReached: boolean }>;
  canCreateCategory: boolean;
  customCategoriesCount: number;
  maxCustomCategories: number;
}

export function AddCategoryModal({
  isOpen, onClose, onCreateCategory, canCreateCategory,
  customCategoriesCount, maxCustomCategories,
}: AddCategoryModalProps) {
  const { t } = useTranslation();
  const v2 = useV2();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IoniconName>('cube-outline');
  const [color, setColor] = useState('#3498DB');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const reset = () => {
    setName(''); setIcon('cube-outline'); setColor('#3498DB'); setBudgetLimit('');
  };
  const handleCreate = async () => {
    if (!name.trim() || !canCreateCategory) return;
    setIsCreating(true);
    const parsed = budgetLimit.trim()
      ? parseInt(budgetLimit.replace(/\s/g, ''), 10) * 100 : null;
    const result = await onCreateCategory({
      name: name.trim(), icon, color,
      budget_limit: parsed && !isNaN(parsed) ? parsed : null,
    });
    if (result.success) { reset(); onClose(); }
    setIsCreating(false);
  };
  const handleClose = () => { reset(); onClose(); };

  if (!canCreateCategory) {
    return (
      <CenterDialog
        isOpen={isOpen}
        onClose={handleClose}
        title={t('category.limitReached')}
        body={t('category.limitMessage', { max: maxCustomCategories })}
        iconName="alert-circle-outline"
        variant="warning"
        footer={
          <DialogButtonRow>
            <DialogPrimaryBtn label={t('common.understood')} onPress={handleClose} />
          </DialogButtonRow>
        }
      />
    );
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={t('category.new')}
      overline={`${customCategoriesCount}/${maxCustomCategories}`}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('common.cancel')} onPress={handleClose} disabled={isCreating} />
          <DialogPrimaryBtn
            label={isCreating ? t('category.creating') : t('category.create')}
            onPress={handleCreate}
            disabled={!name.trim()}
            isLoading={isCreating}
          />
        </DialogButtonRow>
      }
    >
      <View style={{ gap: 18 }}>
        <View>
          <Text style={eyebrow(v2)}>
            {t('category.name')}
          </Text>
          <View
            style={{
              backgroundColor: v2.bgRaised, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
            }}
          >
            <TextInput
              placeholder={t('category.namePlaceholder')}
              placeholderTextColor={v2.inkSubtle}
              value={name}
              onChangeText={setName}
              style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
            />
          </View>
        </View>

        <View>
          <Text style={eyebrow(v2)}>
            {t('category.icon')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {CATEGORY_ICONS.map((iconName) => {
                const sel = icon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => setIcon(iconName)}
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      backgroundColor: sel ? color + '22' : v2.bgRaised,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={iconName} size={22} color={sel ? color : v2.inkSubtle} />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View>
          <Text style={eyebrow(v2)}>
            {t('category.color')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {CATEGORY_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)}>
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: v2.bgSurface,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {color === c ? <Ionicons name="checkmark" size={16} color="#FFF" /> : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={eyebrow(v2)}>
            {t('budget.budgetOptional')}
          </Text>
          <View
            style={{
              backgroundColor: v2.bgRaised, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center',
            }}
          >
            <TextInput
              placeholder={t('budget.budgetPlaceholder')}
              placeholderTextColor={v2.inkSubtle}
              value={budgetLimit}
              onChangeText={setBudgetLimit}
              keyboardType="numeric"
              style={{
                flex: 1, fontFamily: v2.fontUI, fontSize: 14,
                color: v2.ink, padding: 0,
              }}
            />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle, marginLeft: 8 }}>
              Ar
            </Text>
          </View>
        </View>

        <View
          style={{
            padding: 14, borderRadius: 14,
            backgroundColor: color + '15',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: color,
              alignItems: 'center', justifyContent: 'center', marginBottom: 8,
            }}
          >
            <Ionicons name={icon} size={26} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 14, color, letterSpacing: -0.2,
            }}
          >
            {name || t('category.preview')}
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}
