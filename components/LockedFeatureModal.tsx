import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CenterDialog } from '@/components/ui/CenterDialog';
import {
  DialogButtonStack, DialogPrimaryBtn, DialogGhostBtn,
} from '@/components/ui/DialogButtons';

export type LockedFeature = 'account' | 'category' | 'theme';

interface LockedFeatureModalProps {
  feature: LockedFeature | null;
  customTitle?: string;
  customBody?: string;
  onClose: () => void;
}

const FEATURE_META: Record<LockedFeature, {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  color: string; titleKey: string; bodyKey: string;
}> = {
  account: { icon: 'wallet-outline', color: '#3B82F6', titleKey: 'locked.accountTitle', bodyKey: 'locked.accountBody' },
  category: { icon: 'grid-outline', color: '#8B5CF6', titleKey: 'locked.categoryTitle', bodyKey: 'locked.categoryBody' },
  theme: { icon: 'color-palette-outline', color: '#EC4899', titleKey: 'locked.themeTitle', bodyKey: 'locked.themeBody' },
};

export function LockedFeatureModal({
  feature, customTitle, customBody, onClose,
}: LockedFeatureModalProps) {
  const { t } = useTranslation();

  if (feature === null) {
    return (
      <CenterDialog
        isOpen={false}
        onClose={onClose}
        title=""
        showClose={false}
      />
    );
  }

  const meta = FEATURE_META[feature];
  const title = customTitle ?? t(meta.titleKey);
  const body = customBody ?? t(meta.bodyKey);

  const handleViewAchievements = () => {
    onClose();
    router.push('/(tabs)/achievements' as any);
  };

  return (
    <CenterDialog
      isOpen={feature !== null}
      onClose={onClose}
      title={title}
      body={body}
      iconName="lock-closed-outline"
      iconColor={meta.color}
      iconBg={meta.color + '22'}
      showClose={false}
      footer={
        <DialogButtonStack>
          <DialogPrimaryBtn
            label={t('locked.viewAchievements')}
            onPress={handleViewAchievements}
          />
          <DialogGhostBtn label={t('common.cancel')} onPress={onClose} />
        </DialogButtonStack>
      }
    />
  );
}
