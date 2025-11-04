// Updated: 2025-11-04 - Using expo-image-manipulator for better production support
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Convert a local image URI to a base64 data URL
 * @param uri - The local file URI (e.g., from ImagePicker)
 * @returns Base64 data URL string (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
 */
export const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    console.log('[ImageUtils] Converting image to base64:', uri.substring(0, 50) + '...');

    // Use ImageManipulator to process the image and get base64
    // This works reliably in production builds unlike FileSystem
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1000 } }], // Resize to max 1000px width to reduce size
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true
      }
    );

    if (!manipResult.base64) {
      throw new Error('Failed to get base64 from image manipulator');
    }

    // Create data URL with JPEG format
    const dataUrl = `data:image/jpeg;base64,${manipResult.base64}`;

    console.log('[ImageUtils] Base64 conversion complete. Size:', Math.round(dataUrl.length / 1024), 'KB');

    return dataUrl;
  } catch (error) {
    console.error('[ImageUtils] Failed to convert image to base64:', error);
    throw new Error('Failed to convert image to base64');
  }
};

/**
 * Check if a string is a base64 data URL
 * @param str - The string to check
 * @returns True if the string is a base64 data URL
 */
export const isBase64DataUrl = (str: string): boolean => {
  return str.startsWith('data:image/');
};

/**
 * Check if a string is a temporary file URI that needs conversion
 * @param str - The string to check
 * @returns True if the string is a temporary file URI
 */
export const isTemporaryFileUri = (str: string): boolean => {
  return str.startsWith('file://');
};
