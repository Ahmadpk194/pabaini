import { Share } from 'react-native';
import { requestPermissionsAsync, Asset } from 'expo-media-library';

/**
 * ShareService
 * Encapsulates image capture, native sharing, and gallery storage utilities.
 * Updated to use Expo SDK 56 class-based Media Library APIs.
 */
export const ShareService = {
  /**
   * Captures a React Native view via view-shot ref
   * Uses 3x scaling for high quality crisp rendering on retina/compressed displays.
   */
  async captureCard(
    viewRef: { current: any } | any,
    quality: number = 1.0,
    scale: number = 3
  ): Promise<string> {
    if (!viewRef?.current?.capture) {
      throw new Error('ViewShot ref is not initialized or invalid');
    }
    const uri = await viewRef.current.capture({
      format: 'png',
      quality,
      scale,
    });
    if (!uri) {
      throw new Error('Failed to capture view as image');
    }
    return uri;
  },

  /**
   * Opens the OS native sharing sheet with the image URI
   */
  async shareImage(
    uri: string,
    title: string = 'Scorecard',
    message: string = ''
  ): Promise<any> {
    return Share.share({
      title,
      url: uri,
      message: message || title,
    });
  },

  /**
   * Requests media library permissions and saves the image to the device gallery
   * Uses Expo SDK 56 `requestPermissionsAsync` and `Asset.create` APIs.
   */
  async saveImage(uri: string): Promise<void> {
    const { status } = await requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Gallery write permission was denied.');
    }
    // Static class method creating and saving the image as a media asset
    await Asset.create(uri);
  },

  /**
   * Helper to perform both capture and share in one pipeline
   */
  async captureAndShare(
    viewRef: { current: any } | any,
    options: { title?: string; message?: string; quality?: number; scale?: number } = {}
  ): Promise<any> {
    const uri = await this.captureCard(viewRef, options.quality, options.scale);
    return this.shareImage(uri, options.title, options.message);
  },

  /**
   * Helper to perform both capture and gallery save in one pipeline
   */
  async captureAndSave(
    viewRef: { current: any } | any,
    options: { quality?: number; scale?: number } = {}
  ): Promise<void> {
    const uri = await this.captureCard(viewRef, options.quality, options.scale);
    await this.saveImage(uri);
  },
};
