import { SharedValue } from 'react-native-reanimated';

export interface TutorialSlide {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  features: { icon: string; color: string; text: string }[];
  isLast?: boolean;
}

export interface SlideItemProps {
  slide: TutorialSlide;
  index: number;
  translateX: SharedValue<number>;
  screenWidth: number;
}

export interface ProgressDotProps {
  index: number;
  translateX: SharedValue<number>;
  onPress: () => void;
  color: string;
  screenWidth: number;
}
