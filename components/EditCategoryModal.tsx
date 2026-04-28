import { useState, useEffect } from 'react';
import { Pressable, ScrollView, TextInput, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useV2 } from '@/constants/designTokensV2';
import { getCategoryDisplayName } from '@/constants/categories';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: IoniconName[] = [
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

export function EditCategoryModal({
  isOpen, category, onClose, onSave, onSaveComplete, onDelete,
}: EditCategoryModalProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [icon, setIcon] = useState<string>('cube');
  const [color, setColor] = useState('#3498DB');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      const displayName = getCategoryDisplayName(category.id, category.name, t);
      setName(displayName);
      setInitialDisplayName(displayName);
      setIcon(category.icon || 'cube');
      setColor(category.color || '#3498DB');
      setBudgetLimit(category.budget_limit ? String(category.budget_limit / 100) : '');
    }
  }, [category, t]);

  const handleSave = async () => {
    if (!category || !name.trim()) return;
    setIsSaving(true);
    const parsed = budgetLimit.trim() ? parseInt(budgetLimit.replace(/\s/g, ''), 10) * 100 : null;
    const trimmed = name.trim();
    const nameChanged = trimmed !== initialDisplayName;
    await onSave(category.id, {
      ...(nameChanged ? { name: trimmed } : {}),
      icon, color,
      budget_limit: parsed && !isNaN(parsed) ? parsed : null,
    });
    setIsSaving(false);
    onClose();
    onSaveComplete?.();
  };

  if (!category) return null;
  const isEditable = category.id !== 'other';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('budget.editCategory')}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={onClose}
            disabled={isSaving}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              borderWidth: 1, borderColor: v2.hairlineStrong,
              alignItems: 'center', justifyContent: 'center',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || isSaving}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              backgroundColor: v2.bgInk,
              alignItems: 'center', justifyContent: 'center',
              opacity: !name.trim() || isSaving ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
              {isSaving ? '...' : t('common.save')}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ gap: 16 }}>
        {isEditable && onDelete ? (
          <Pressable
            onPress={() => { onClose(); onDelete(category); }}
            style={{
              alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
              backgroundColor: v2.badSoft,
            }}
          >
            <Ionicons name="trash-outline" size={14} color={v2.bad} />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: v2.bad }}>
              {t('budget.deleteCategory')}
            </Text>
          </Pressable>
        ) : null}

        {isEditable ? (
          <>
            <Field v2={v2} label={t('category.name')}>
              <View style={{ backgroundColor: v2.bgRaised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                <TextInput
                  placeholder={t('category.namePlaceholder')} placeholderTextColor={v2.inkSubtle}
                  value={name} onChangeText={setName}
                  style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
                />
              </View>
            </Field>

            <Field v2={v2} label={t('category.icon')}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {CATEGORY_ICONS.map((ic) => {
                  const active = icon === ic;
                  return (
                    <Pressable
                      key={ic}
                      onPress={() => setIcon(ic)}
                      style={{
                        width: 48, height: 48, borderRadius: 12,
                        backgroundColor: active ? color + '20' : v2.bgRaised,
                        borderWidth: active ? 1.5 : 0, borderColor: color,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={ic} size={22} color={active ? color : v2.inkSubtle} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Field>

            <Field v2={v2} label={t('category.color')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {CATEGORY_COLORS.map((c) => (
                  <Pressable key={c} onPress={() => setColor(c)}>
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 999,
                        backgroundColor: c,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: color === c ? 3 : 0,
                        borderColor: color === c ? v2.bgSurface : 'transparent',
                      }}
                    >
                      {color === c ? <Ionicons name="checkmark" size={18} color="#FFF" /> : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>
          </>
        ) : null}

        <Field v2={v2} label={t('budget.budgetOptional')}>
          <View
            style={{
              backgroundColor: v2.bgRaised, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}
          >
            <TextInput
              placeholder={t('budget.budgetPlaceholder')} placeholderTextColor={v2.inkSubtle}
              value={budgetLimit} onChangeText={setBudgetLimit} keyboardType="numeric"
              style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
            />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle }}>Ar</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 }}>
            <Ionicons name="information-circle-outline" size={14} color={v2.inkSubtle} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle }}>
              {t('budget.editCurrentMonthOnly')}
            </Text>
          </View>
        </Field>
      </View>
    </BottomSheet>
  );
}

interface FieldProps { v2: ReturnType<typeof useV2>; label: string; children: React.ReactNode; }
function Field({ v2, label, children }: FieldProps) {
  return (
    <View>
      <Text style={{
        fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
        letterSpacing: 1.5, textTransform: 'uppercase',
        color: v2.inkSubtle, marginBottom: 8,
      }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
