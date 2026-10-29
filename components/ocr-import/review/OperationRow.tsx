import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { getCategoryDisplayName } from '@/constants/categories';
import { isLocked, type ReviewItem } from '@/lib/ocr/import/review';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Fond léger de la pastille d'icône à partir d'une couleur #rrggbb. */
function tint(color: string): string {
  return color.startsWith('#') && color.length === 7 ? `${color}1F` : 'rgba(127,127,127,0.12)';
}

interface OperationRowProps {
  item: ReviewItem;
  category: Category | null;
  counterAccountName: string | null;
  formatMoney: (cents: number) => string;
  onToggle: () => void;
  onPress: () => void;
}

export function OperationRow({
  item, category, counterAccountName, formatMoney, onToggle, onPress,
}: OperationRowProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const isCredit = item.direction === 'credit';
  const amountColor = isCredit && item.kind !== 'transfer' ? v2.good : item.kind === 'transfer' ? v2.inkMuted : v2.ink;

  const locked = isLocked(item);
  const label = item.note || item.op.label;
  const badge = item.duplicate
    ? { text: t(`ocrImport.${item.duplicate === 'reference' ? 'dupReference' : item.duplicate === 'similar' ? 'dupSimilar' : 'dupBatch'}`), fg: v2.warn, bg: v2.warnSoft }
    : item.op.uncertain.some((f) => f === 'amount' || f === 'sign' || f === 'date')
      ? { text: t('ocrImport.toCheck'), fg: v2.bad, bg: v2.badSoft }
      : null;

  let tagIcon: IoniconName = 'pricetag-outline';
  let tagText = t('ocrImport.noCategory');
  let tagColor = v2.inkSubtle;
  if (item.kind === 'transfer') {
    tagIcon = 'swap-horizontal';
    tagText = `${t('ocrImport.edit.transfer')} ${isCredit ? '←' : '→'} ${counterAccountName ?? t('ocrImport.noAccount')}`;
    tagColor = v2.inkMuted;
  } else if (item.kind === 'income') {
    tagIcon = 'arrow-down';
    tagText = t('ocrImport.edit.income');
    tagColor = v2.good;
  } else if (category) {
    tagIcon = (category.icon as IoniconName) ?? 'pricetag-outline';
    tagText = getCategoryDisplayName(category.id, category.name, t);
    tagColor = category.color ?? v2.brand;
  }

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: v2.bgSurface, borderRadius: 16, borderWidth: 1,
        borderColor: item.selected ? v2.hairlineStrong : v2.hairline,
        paddingVertical: 12, paddingRight: 14, paddingLeft: 4,
        // Décochée : grisée. Bloquée : pas d'opacité (contraste ≥ 4.5:1), textes en inkMuted.
        opacity: item.selected || locked ? 1 : 0.55,
      }}
    >
      <Pressable
        onPress={onToggle}
        disabled={locked}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.selected, disabled: locked }}
        accessibilityLabel={locked ? t('ocrImport.lockedA11y', { label }) : label}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <View
          style={{
            width: 22, height: 22, borderRadius: 7, borderWidth: 1.5,
            borderColor: item.selected ? v2.brand : v2.hairlineStrong,
            // Bloquée : case pleine grise avec cadenas, impossible à cocher.
            backgroundColor: item.selected ? v2.brand : locked ? v2.hairline : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {item.selected ? <Ionicons name="checkmark" size={15} color={v2.inkOnDark} />
            : locked ? <Ionicons name="lock-closed" size={12} color={v2.inkSubtle} /> : null}
        </View>
      </Pressable>

      <Pressable onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: tint(tagColor), opacity: locked ? 0.5 : 1,
          }}
        >
          <Ionicons name={tagIcon} size={16} color={tagColor} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          {badge ? (
            <View
              style={{
                alignSelf: 'flex-start', marginBottom: 3, backgroundColor: badge.bg,
                borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
              }}
            >
              <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', color: badge.fg }}>
                {badge.text}
              </Text>
            </View>
          ) : null}
          <Text
            numberOfLines={2}
            style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: locked ? v2.inkMuted : v2.ink }}
          >
            {item.note || item.op.label}
          </Text>
          <Text numberOfLines={1} style={{ marginTop: 2, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted }}>
            {tagText}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: locked ? v2.inkMuted : amountColor,
              fontVariant: ['tabular-nums'], letterSpacing: -0.2,
            }}
          >
            {`${isCredit ? '+' : '−'}${formatMoney(item.amount)}`}
          </Text>
          {/* Bouton visible (plus de geste caché) : 30 px + hitSlop 8 = zone de 46 px. */}
          <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('ocrImport.editA11y', { label })}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4, height: 30, paddingHorizontal: 10,
              borderRadius: 15, borderWidth: 1, borderColor: v2.hairlineStrong, backgroundColor: v2.bgBase,
            }}
          >
            <Ionicons name="pencil" size={12} color={v2.ink} />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: v2.ink }}>
              {t('ocrImport.editButton')}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}
