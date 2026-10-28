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
  /** Website URL, for products that live on the web rather than on a store. */
  siteUrl?: string;
}

// Referrer so Play Console / site analytics show the visits coming from Mitsitsy.
const UTM = 'utm_source=mitsitsy&utm_medium=other_apps';

export const OTHER_APPS: OtherApp[] = [
  {
    id: 'monster-cannon',
    name: 'Monster Cannon',
    taglineKey: 'otherApps.monsterCannonTagline',
    icon: require('@/assets/images/other-apps/monster-cannon.png'),
    accent: '#E8553B',
    storeUrl: `https://play.google.com/store/apps/details?id=com.rdh36.mosntercannon&referrer=${encodeURIComponent(UTM)}`,
  },
  {
    id: 'hifety',
    name: 'Hifety',
    taglineKey: 'otherApps.hifetyTagline',
    icon: require('@/assets/images/other-apps/hifety.png'),
    accent: '#5E0B2F',
    siteUrl: `https://hifety.com/?${UTM}`,
  },
  {
    id: 'flipia',
    name: 'Flipia',
    taglineKey: 'otherApps.flipiaTagline',
    icon: require('@/assets/images/other-apps/flipia.png'),
    accent: '#3F37A6',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.rdh36.flipia',
  },
];
