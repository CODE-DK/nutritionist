// photoService - сервис для работы с фото-распознаванием еды

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../config/supabase';
import { APP_CONFIG, PHOTO_CONFIG } from '../config/constants';
import type { PhotoAnalysisResult, PhotoUsage, ApiError } from '../types';

class PhotoService {
  /**
   * 1. Запросить permission для камеры
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw this.createError(
          'Для съемки еды нужен доступ к камере. Разрешите в настройках.',
          'CAMERA_PERMISSION_DENIED'
        );
      }
      return true;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 2. Запросить permission для галереи
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw this.createError(
          'Для выбора фото нужен доступ к галерее. Разрешите в настройках.',
          'MEDIA_LIBRARY_PERMISSION_DENIED'
        );
      }
      return true;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 3. Открыть камеру и сделать фото
   */
  async capturePhoto(): Promise<string | null> {
    try {
      await this.requestCameraPermission();

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: PHOTO_CONFIG.COMPRESSION_QUALITY,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 4. Выбрать фото из галереи
   */
  async pickFromGallery(): Promise<string | null> {
    try {
      await this.requestMediaLibraryPermission();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: PHOTO_CONFIG.COMPRESSION_QUALITY,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 5. Сжать изображение (если > 2MB)
   */
  async compressImage(
    uri: string,
    maxSizeBytes: number = APP_CONFIG.MAX_PHOTO_SIZE_MB * 1024 * 1024
  ): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw this.createError('Файл не найден', 'FILE_NOT_FOUND');
      }

      // Если размер <= 2MB, возвращаем как есть
      if (fileInfo.size && fileInfo.size <= maxSizeBytes) {
        return uri;
      }

      // Используем manipulateAsync для сжатия
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: PHOTO_CONFIG.MAX_WIDTH } }], // Resize до ширины 1024px
        {
          compress: PHOTO_CONFIG.COMPRESSION_QUALITY,
          format: SaveFormat.JPEG,
        }
      );

      console.log('Image compressed from', fileInfo.size, 'to', manipResult.uri);
      return manipResult.uri;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 6. Конвертировать в base64 для отправки в Edge Function
   */
  async imageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 7. Анализировать фото через Edge Function
   */
  async analyzeFood(photoUri: string, userId: string): Promise<PhotoAnalysisResult> {
    try {
      console.log('Starting photo analysis...');

      // Шаг 1: Сжатие
      const compressedUri = await this.compressImage(photoUri);
      console.log('Image compressed:', compressedUri);

      // Шаг 2: Base64
      const base64Image = await this.imageToBase64(compressedUri);
      console.log('Image converted to base64, length:', base64Image.length);

      // Шаг 3: Вызов Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-food-photo', {
        body: {
          image: base64Image,
          userId: userId,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('AI analysis result:', data);

      // Шаг 4: Валидация ответа
      if (data.confidence < PHOTO_CONFIG.MIN_CONFIDENCE) {
        throw this.createError(
          'Не удалось распознать еду на фото. Попробуйте другое фото или введите вручную.',
          'LOW_CONFIDENCE'
        );
      }

      // Шаг 5: Upload фото в Storage (асинхронно, не блокируя UI)
      let photoUrl: string | undefined;
      try {
        photoUrl = await this.uploadToStorage(compressedUri, userId);
        console.log('Photo uploaded to storage:', photoUrl);
      } catch (uploadError) {
        console.warn('Photo upload failed, continuing without storage URL:', uploadError);
        // Не прерываем процесс если upload failed
      }

      return {
        dishName: data.dish_name,
        calories: Math.round(data.calories),
        protein: Math.round(data.protein * 10) / 10, // Округление до 0.1
        carbs: Math.round(data.carbs * 10) / 10,
        fat: Math.round(data.fat * 10) / 10,
        confidence: data.confidence,
        reasoning: data.reasoning || '',
        photoUri: compressedUri, // Local URI
        photoUrl: photoUrl, // Storage URL (optional)
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 8. Upload фото в Supabase Storage
   */
  async uploadToStorage(uri: string, userId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.jpg`;

      // Читаем файл как blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload в Storage
      const { data, error } = await supabase.storage
        .from('food-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('food-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 9. Получить статистику использования фото
   */
  async getPhotoUsage(userId: string): Promise<PhotoUsage> {
    try {
      // Получаем usage за сегодня через RPC функцию
      const { data: usageCount, error: usageError } = await supabase.rpc(
        'get_current_photo_usage',
        {
          p_user_id: userId,
        }
      );

      if (usageError) {
        console.error('Error getting photo usage:', usageError);
        // Fallback: не блокируем если ошибка, возвращаем 0
      }

      const currentCount = usageCount || 0;

      // Получаем лимит из профиля пользователя
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const limit =
        userData?.subscription_tier === 'premium'
          ? APP_CONFIG.PREMIUM_PHOTO_LIMIT
          : APP_CONFIG.FREE_PHOTO_LIMIT;

      return {
        current: currentCount,
        limit: limit,
        remaining: Math.max(0, limit - currentCount),
      };
    } catch (error: any) {
      // В случае ошибки возвращаем free tier лимит
      console.error('Error in getPhotoUsage:', error);
      return {
        current: 0,
        limit: APP_CONFIG.FREE_PHOTO_LIMIT,
        remaining: APP_CONFIG.FREE_PHOTO_LIMIT,
      };
    }
  }

  /**
   * 10. Проверить доступность лимита фото
   */
  async canTakePhoto(userId: string): Promise<boolean> {
    const usage = await this.getPhotoUsage(userId);
    return usage.remaining > 0;
  }

  /**
   * 11. Удалить старые фото (cleanup для Free tier)
   */
  async cleanupOldPhotos(userId: string, daysToKeep: number = APP_CONFIG.PHOTO_CLEANUP_DAYS): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data: oldPhotos } = await supabase
        .from('food_diary')
        .select('photo_url')
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString())
        .not('photo_url', 'is', null);

      if (!oldPhotos || oldPhotos.length === 0) return;

      // Извлекаем пути из URLs и удаляем из Storage
      const filePaths = oldPhotos
        .map((entry: any) => {
          const url = entry.photo_url;
          if (!url) return null;

          // Извлекаем путь из URL: .../food-photos/user_id/timestamp.jpg
          const match = url.match(/food-photos\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        await supabase.storage.from('food-photos').remove(filePaths);
        console.log(`Cleaned up ${filePaths.length} old photos`);
      }

      // Очищаем photo_url в БД
      await supabase
        .from('food_diary')
        .update({ photo_url: null })
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString());
    } catch (error: any) {
      console.error('Cleanup old photos error:', error);
      // Не прерываем процесс при ошибке cleanup
    }
  }

  // ===== Приватные методы для обработки ошибок =====

  private createError(message: string, code: string): ApiError {
    return {
      message,
      code,
      statusCode: code === 'LOW_CONFIDENCE' ? 422 : 400,
    };
  }

  private handleError(error: any): ApiError {
    // Edge Function error
    if (error.context?.body) {
      return {
        message: error.context.body.error || 'Ошибка при анализе фото',
        code: error.context.body.code || 'EDGE_FUNCTION_ERROR',
        statusCode: error.context.status || 500,
      };
    }

    // Permission errors
    if (
      error.code === 'CAMERA_PERMISSION_DENIED' ||
      error.code === 'MEDIA_LIBRARY_PERMISSION_DENIED'
    ) {
      return error;
    }

    // Low confidence
    if (error.code === 'LOW_CONFIDENCE') {
      return error;
    }

    // Network errors
    if (error.message?.includes('network') || error.message?.includes('Network')) {
      return {
        message: 'Проверьте подключение к интернету',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      };
    }

    // Photo limit exceeded
    if (error.message?.includes('PHOTO_LIMIT_EXCEEDED')) {
      return {
        message: error.message,
        code: 'PHOTO_LIMIT_EXCEEDED',
        statusCode: 429,
      };
    }

    // Generic error
    return {
      message: error.message || 'Произошла ошибка при обработке фото',
      code: error.code || 'PHOTO_ERROR',
      statusCode: error.status || 500,
    };
  }
}

export default new PhotoService();
