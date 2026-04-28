import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useV2 } from '@/constants/designTokensV2';
import type { Category } from '@/types';
import { CategorySheetGrid } from './CategorySheetGrid';
import { CategorySheetTopBar, type FilterKey } from './CategorySheetTopBar';

interface CategorySelectSheetProps {
  isOpen: boolean;
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onCreatePress?: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function CategorySelectSheet({
  isOpen,
  categories,
  selectedId,
  onSelect,
  onClose,
  onCreatePress,
}: CategorySelectSheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [draftId, setDraftId] = useState<string | null>(selectedId);
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setDraftId(selectedId);
      setSearch('');
      setFilter('all');
      setMounted(true);
      translateY.value = withTiming(0, { duration: 240 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedId]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const filtered = useMemo(() => {
    let list = categories;
    if (filter === 'expenses') {
      list = list.filter((c) => c.category_type === 'expense' || !c.category_type);
    } else if (filter === 'income') {
      list = list.filter((c) => c.category_type === 'income');
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    return list;
  }, [categories, filter, search]);

  const draftName = useMemo(
    () => categories.find((c) => c.id === draftId)?.name ?? null,
    [categories, draftId]
  );

  const handleConfirm = () => {
    if (draftId) {
      onSelect(draftId);
      onClose();
    }
  };

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: v2.bgSurface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderColor: v2.hairlineStrong,
              maxHeight: '78%',
              paddingBottom: insets.bottom,
              shadowColor: '#000',
              shadowOpacity: 0.4,
              shadowRadius: 32,
              shadowOffset: { width: 0, height: -12 },
              elevation: 24,
            },
            sheetStyle,
          ]}
        >
          <CategorySheetTopBar
            search={search}
            onSearchChange={setSearch}
            count={filtered.length}
            filter={filter}
            onFilterChange={setFilter}
            onClose={onClose}
          />

          <CategorySheetGrid
            categories={filtered}
            draftId={draftId}
            onSelect={setDraftId}
            onCreatePress={onCreatePress ? () => { onCreatePress(); onClose(); } : undefined}
          />

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderTopColor: v2.hairline,
            }}
          >
            <Pressable
              onPress={handleConfirm}
              disabled={!draftId}
              style={{
                backgroundColor: v2.bgInk,
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: draftId ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  fontFamily: v2.fontUI,
                  fontSize: 13,
                  fontWeight: '700',
                  color: v2.inkOnDark,
                }}
              >
                {draftName
                  ? t('add.chooseCategory', { name: draftName })
                  : t('add.chooseACategory')}
              </Text>
              <Ionicons name="checkmark" size={14} color={v2.inkOnDark} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
