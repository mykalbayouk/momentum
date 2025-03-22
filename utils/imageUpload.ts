import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export async function uploadImage(uri: string, bucket: string, userId: string): Promise<{ url: string; path: string }> {
  try {
    console.log('Starting image upload process...');
    console.log('Reading image file from URI:', uri);
    
    // Read the file as a Base64-encoded string
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('Successfully read image file, converting to base64...');
    
    // Decode the Base64 string to an ArrayBuffer
    const arrayBuffer = decode(base64);
    console.log('Converted to array buffer, size:', arrayBuffer.byteLength);
    
    // Get file extension from URI
    const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    console.log('Preparing to upload to path:', filePath);
    
    console.log('Attempting to upload to Supabase storage...');
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true, // Changed from false to true to match old implementation
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('Upload successful, getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('Public URL obtained:', publicUrl);
    return { url: publicUrl, path: filePath };
  } catch (error) {
    console.error('Detailed upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    throw new Error('Failed to upload image: Unknown error');
  }
}

export async function deleteImage(url: string, bucket: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlParts = url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get the last two parts (user_id/filename)
    
    console.log('Attempting to delete image from path:', filePath);
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
} 