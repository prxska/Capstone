import { File } from 'expo-file-system';
import { supabase } from './supabase';

export const MEDICATION_PHOTOS_BUCKET = 'medication-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function uploadMedicationPhoto(uri: string, userId: string, recipeId: string | null) {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('La foto ya no está disponible en este dispositivo. Selecciónala nuevamente.');
  }

  const extension = file.extension.replace(/^\./, '').toLowerCase();
  const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
  const objectId = recipeId || `new-${Date.now()}`;
  const path = `${userId}/recipes/${objectId}.${safeExtension}`;
  const { error } = await supabase.storage.from(MEDICATION_PHOTOS_BUCKET).upload(
    path,
    await file.arrayBuffer(),
    {
      cacheControl: '3600',
      contentType: file.type || 'image/jpeg',
      upsert: true,
    }
  );

  if (error) throw error;
  return path;
}

export async function getMedicationPhoto(
  reference: string,
  userId?: string,
  recipeId?: string
): Promise<{ photoUri: string; photoStoragePath: string }> {
  if (!reference) return { photoUri: '', photoStoragePath: '' };
  if (/^https?:/i.test(reference)) {
    return { photoUri: reference, photoStoragePath: '' };
  }
  if (/^(file:|content:|data:)/i.test(reference)) {
    const localFile = new File(reference);
    if (localFile.exists && userId) {
      try {
        const path = await uploadMedicationPhoto(reference, userId, recipeId || null);
        return getMedicationPhoto(path);
      } catch (error) {
        console.warn('No se pudo migrar la foto local del medicamento a Storage:', error);
      }
    }
    return localFile.exists
      ? { photoUri: reference, photoStoragePath: '' }
      : { photoUri: '', photoStoragePath: '' };
  }

  const { data, error } = await supabase.storage
    .from(MEDICATION_PHOTOS_BUCKET)
    .createSignedUrl(reference, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.warn('No se pudo crear el enlace de la foto del medicamento:', error.message);
    return { photoUri: '', photoStoragePath: reference };
  }

  return { photoUri: data.signedUrl, photoStoragePath: reference };
}
