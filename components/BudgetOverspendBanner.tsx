import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { BudgetData } from '@/hooks/useBudgets';

const DEFAULT_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

interface BudgetOverspendBannerProps {
  overspentBudgets: BudgetData[];
}

export function BudgetOverspendBanner({ overspentBudgets }: BudgetOverspendBannerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (overspentBudgets.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % overspentBudgets.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [overspentBudgets.length]);

  if (overspentBudgets.length === 0) return null;

  const current = overspentBudgets[currentIndex % overspentBudgets.length];
  if (!current) return null;

  const categoryName = DEFAULT_IDS.includes(current.category.id)
    ? t(`categories.${current.category.id}`) : current.category.name;

  return (
    <Pressable onPress={() => router.push(`/category/${current.category.id}` as any)}>
      <View className="mt-3 py-2 px-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <RNText className="text-sm font-body-bold text-center" style={{ color: '#FFFFFF' }}>
          🔴 {t('budget.exceededBanner', { category: categoryName })}
        </RNText>
      </View>
    </Pressable>
  );
}
