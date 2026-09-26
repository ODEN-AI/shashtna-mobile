import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { ProofFile } from '@/src/api/orders';

/**
 * Picks a transfer screenshot (or takes a photo) and shrinks it to a JPEG
 * well under the server's 4 MB limit — faster uploads on mobile data.
 */
const MAX_EDGE = 1600;

export type PickResult = { file: ProofFile; width: number; height: number } | { error: string } | null;

export async function pickProof(source: 'library' | 'camera'): Promise<PickResult> {
  const permission =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { error: source === 'camera' ? 'نحتاج إذن الكاميرا حتى تصوّر الإثبات.' : 'نحتاج إذن الصور حتى تختار صورة الإثبات.' };
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: false, exif: false };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);

  if (longest > MAX_EDGE) {
    context.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.72 });

  return {
    file: { uri: saved.uri, name: `proof-${Date.now()}.jpg`, type: 'image/jpeg' },
    width: saved.width,
    height: saved.height,
  };
}
