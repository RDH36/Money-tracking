import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { bulkAction, type ReviewItem } from '@/lib/ocr/import/review';

interface BulkToggleProps {
  /** Lignes concernées (liste entière ou groupe de date). */
  items: ReviewItem[];
  onPress: (keys: string[]) => void;
  /** Portée lue par le lecteur d'écran (date du groupe), sinon toute la liste. */
  scope?: string;
}

/** « Tout cocher » → « Cocher aussi les doublons (N) » → « Tout décocher ». */
export function BulkToggle({ items, onPress, scope }: BulkToggleProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const { action, duplicates } = bulkAction(items);
  if (action === 'none') return null;
  const label = action === 'clear'
    ? t('ocrImport.bulk.clear')
    : action === 'selectDuplicates'
      ? t('ocrImport.bulk.duplicates', { count: duplicates })
      : t('ocrImport.bulk.all');
  return (
    <Pressable
      onPress={() => onPress(items.map((i) => i.key))}
      accessibilityRole="button"
      accessibilityLabel={scope ? `${label}, ${scope}` : label}
      hitSlop={8}
      style={{ paddingVertical: 4, paddingHorizontal: 2 }}
    >
      <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.brand }}>{label}</Text>
    </Pressable>
  );
}
