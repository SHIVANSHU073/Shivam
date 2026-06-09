import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickResult = { base64: string; uri: string } | null;

export async function pickImage(opts: {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
} = {}): Promise<PickResult> {
  // Permission flow
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      throw new Error('Photo library permission required');
    }
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: opts.allowsEditing ?? true,
    aspect: opts.aspect,
    quality: opts.quality ?? 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets || !res.assets[0]) return null;
  const a = res.assets[0];
  const mime = a.mimeType || 'image/jpeg';
  const b64 = a.base64 ? `data:${mime};base64,${a.base64}` : '';
  return { base64: b64, uri: a.uri };
}
