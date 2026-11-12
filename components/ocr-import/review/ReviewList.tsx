import { useMemo, type ReactElement } from 'react';
import { View, Text, Pressable, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { identicalGroups, type ReviewItem } from '@/lib/ocr/import/review';
import { BulkToggle } from './BulkToggle';

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
  /** Enregistrement interdit (compte espèces sous zéro). */
  blocked?: boolean;
  /** Interrupteur « Tout cocher » de ces lignes. */
  onToggleMany: (keys: string[]) => void;
}

function dateHeader(ymd: string, locale: string): string {
  const d = new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Opérations groupées par date (comme l'appli de la banque), bouton collant en bas. */
export function ReviewList({
  items, header, renderItem, locale, selectedCount, saving, notice, onSave, blocked = false, onToggleMany,
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
    // Opérations identiques du jour : une seule carte (lignes gardées), à la place de la 1re.
    const toRows = (list: ReviewItem[]): ReviewItem[][] => {
      const groupOf = new Map<string, string[]>();
      for (const g of identicalGroups(list)) for (const k of g) groupOf.set(k, g);
      const rows: ReviewItem[][] = [];
      for (const item of list) {
        const g = groupOf.get(item.key);
        if (!g) rows.push([item]);
        else if (g[0] === item.key) rows.push(list.filter((i) => g.includes(i.key)));
      }
      return rows;
    };
    return [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([date, all]) => ({ date, all, data: toRows(all) }));
  }, [items]);

  const disabled = selectedCount === 0 || saving || blocked;

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(row) => row[0].key}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            {header}
            {/* Une seule date : l'interrupteur du groupe suffit. Plusieurs : celui-ci porte sur toutes. */}
            {sections.length > 1 ? (
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: v2.inkMuted }}>
                  {t('ocrImport.bulk.everything', { count: sections.length })}
                </Text>
                <BulkToggle items={items} onPress={onToggleMany} />
              </View>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              // 1er groupe : collé à l'en-tête (pas de vide sous le choix du compte).
              marginTop: section.date === sections[0]?.date ? 10 : 18,
              marginBottom: 8, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between', gap: 8,
            }}
          >
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700',
                letterSpacing: 1, textTransform: 'uppercase', color: v2.inkSubtle,
              }}
            >
              {dateHeader(section.date, locale)}
            </Text>
            {/* Un seul « Tout cocher » à l'écran : celui de la liste quand il y a plusieurs dates. */}
            {sections.length === 1 ? (
              <BulkToggle items={section.all} onPress={onToggleMany} scope={dateHeader(section.date, locale)} />
            ) : null}
          </View>
        )}
        renderItem={({ item: row }) => (row.length === 1 ? (
          <View style={{ marginBottom: 8 }}>{renderItem(row[0])}</View>
        ) : (
          <View
            style={{
              // Marge fine et égale sur les 4 côtés : les lignes gardent presque la largeur d'une carte seule.
              marginBottom: 8, padding: 6, gap: 6, borderRadius: 18,
              borderWidth: 1, borderColor: v2.warn, backgroundColor: v2.warnSoft,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 }}>
              <Ionicons name="copy-outline" size={13} color={v2.warn} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, lineHeight: 17, color: v2.warn }}>
                {t('ocrImport.identicalGroup', { count: row.length })}
              </Text>
            </View>
            {row.map((i) => <View key={i.key}>{renderItem(i)}</View>)}
          </View>
        ))}
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
