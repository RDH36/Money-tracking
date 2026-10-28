import { useMemo, type ReactElement } from 'react';
import { View, Text, Pressable, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { ReviewItem } from '@/lib/ocr/import/review';

interface ReviewListProps {
  items: ReviewItem[];
  header: ReactElement;
  renderItem: (item: ReviewItem) => ReactElement;
  locale: string;
  selectedCount: number;
  saving: boolean;
  /** Message sous le bouton : erreur d'enregistrement, opérations invalides, doublon coché. */
  notice: { text: string; tone: 'warn' | 'bad' } | null;
  onSave: () => void;
}

function dateHeader(ymd: string, locale: string): string {
  const d = new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Opérations groupées par date (comme l'appli de la banque), bouton collant en bas. */
export function ReviewList({
  items, header, renderItem, locale, selectedCount, saving, notice, onSave,
}: ReviewListProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Plus récent d'abord ; l'ordre de lecture est gardé à date égale.
  const sections = useMemo(() => {
    const byDate = new Map<string, ReviewItem[]>();
    for (const item of items) {
      const list = byDate.get(item.date) ?? [];
      list.push(item);
      byDate.set(item.date, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([date, data]) => ({ date, data }));
  }, [items]);

  const disabled = selectedCount === 0 || saving;

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.key}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={<View style={{ marginBottom: 4 }}>{header}</View>}
        renderSectionHeader={({ section }) => (
          <Text
            style={{
              marginTop: 18, marginBottom: 8, fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700',
              letterSpacing: 1, textTransform: 'uppercase', color: v2.inkSubtle,
            }}
          >
            {dateHeader(section.date, locale)}
          </Text>
        )}
        renderItem={({ item }) => <View style={{ marginBottom: 8 }}>{renderItem(item)}</View>}
      />
      <View
        style={{
          paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16,
          borderTopWidth: 1, borderTopColor: v2.hairline, backgroundColor: v2.bgBase,
        }}
      >
        {notice ? (
          <Text
            style={{
              marginBottom: 8, fontFamily: v2.fontUI, fontSize: 12, textAlign: 'center',
              color: notice.tone === 'bad' ? v2.bad : v2.warn,
            }}
          >
            {notice.text}
          </Text>
        ) : null}
        <Pressable
          onPress={onSave}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          style={{
            backgroundColor: v2.bgInk, borderRadius: 14, paddingVertical: 16,
            borderWidth: 1, borderColor: v2.hairlineStrong,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: disabled ? 0.45 : 1,
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.inkOnDark }}>
            {saving
              ? t('ocrImport.saving')
              : selectedCount === 0
                ? t('ocrImport.saveNone')
                : t('ocrImport.save', { count: selectedCount })}
          </Text>
          {!disabled ? <Ionicons name="checkmark" size={15} color={v2.inkOnDark} /> : null}
        </Pressable>
      </View>
    </>
  );
}
