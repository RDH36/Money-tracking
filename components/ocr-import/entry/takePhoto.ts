import * as ImagePicker from 'expo-image-picker';

export type PhotoResult = { uris: string[] } | { denied: true };

/**
 * Photo d'un ticket prise depuis l'appli, avec l'écran de recadrage du
 * système. Liste vide si l'utilisateur annule ; `denied` sans permission.
 */
export async function takeTicketPhoto(): Promise<PhotoResult> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { denied: true };
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1,
    exif: false,
  });
  return { uris: res.canceled ? [] : res.assets.map((a) => a.uri) };
}
