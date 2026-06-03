import type { ImageSourcePropType } from 'react-native';

export interface OtherApp {
  id: string;
  name: string;
  /** i18n key for the short tagline. */
  taglineKey: string;
  icon: ImageSourcePropType;
  /** Brand accent color (used for the icon tile + CTA). */
  accent: string;
  /** Store URL. Omit for apps that are not released yet (shows "coming soon"). */
  storeUrl?: string;
}

export const OTHER_APPS: OtherApp[] = [
  {
    id: 'flipia',
    name: 'Flipia',
    taglineKey: 'otherApps.flipiaTagline',
    icon: require('@/assets/images/other-apps/flipia.png'),
    accent: '#3F37A6',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.rdh36.flipia',
  },
];
