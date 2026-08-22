import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
import { pinata } from '../lib/pinata';
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
      const { url } = await api.get('/upload/presigned_url');
      const upload = await pinata.upload.public.file(imageFile).url(url);
      
      if (!upload.cid) {
        throw new Error('Upload failed: No CID returned');
      }

      const ipfsLink = await pinata.gateways.public.convert(upload.cid);
      return ipfsLink;
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
      const insertedData = await api.post('/posts', postData);

      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
      
      return insertedData || null;
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
