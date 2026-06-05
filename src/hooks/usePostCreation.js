import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const usePostCreation = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const validateImage = useCallback((file) => {
    if (!file) return null;
    
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image must be smaller than 5MB';
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are allowed';
    }
    
    return null;
  }, []);

  const uploadImage = useCallback(async (imageFile) => {
    if (!imageFile) return '';
    
    setIsUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Provide better error messages for common issues
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error(
            'Storage bucket not configured. Please create the "assets" bucket in Supabase Storage settings and make it public. ' +
            'See setup-storage.js for automated setup.'
          );
        } else if (uploadError.message.includes('Unauthorized')) {
          throw new Error('Not authorized to upload. Check storage permissions.');
        } else if (uploadError.message.includes('413')) {
          throw new Error('File is too large. Maximum size is 5MB.');
        }
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      // Re-throw with context for better debugging
      console.error('Image upload error:', {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type,
        error: error.message
      });
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

  const createPost = useCallback(async (postData) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const { error: postError, data: insertedData } = await supabase
        .from('posts')
        .insert([postData])
        .select();

      if (postError) {
        throw new Error(`Failed to create post: ${postError.message}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
      
      return insertedData?.[0] || null;
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error.message || 'Failed to create post';
      toast.error(errorMessage);
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient]);

  return {
    isSubmitting,
    isUploadingImage,
    errors,
    setErrors,
    validateImage,
    uploadImage,
    createPost,
  };
};
