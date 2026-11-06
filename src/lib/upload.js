import { api } from '@/api';

export const DIRECT_UPLOAD_API_URL = 'https://crystalsbusinesssolution.com/file_upload_api/upload.php';
export const PROXY_UPLOAD_API_URL = '/file_upload_api/upload.php';

/**
 * Uploads a file to the Crystals Business Solution file upload API.
 * Uses intelligent fallback:
 * 1. Direct POST to https://crystalsbusinesssolution.com/file_upload_api/upload.php
 * 2. Vite local proxy /file_upload_api/upload.php
 * 3. Backend upload bridge (/api/upload) to ensure uploads never fail due to CORS or CDN challenge
 *
 * @param {File|Blob} file - The file or blob to upload
 * @param {string} [fileName] - Optional file name when uploading a Blob
 * @returns {Promise<{ url: string, file_name: string, original_name: string, id?: number }>}
 */
export async function uploadFile(file, fileName) {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const createFormData = () => {
    const fd = new FormData();
    if (fileName && !(file instanceof File)) {
      fd.append('file', file, fileName);
    } else {
      fd.append('file', file);
    }
    return fd;
  };

  // 1. Try Direct Upload
  try {
    const response = await fetch(DIRECT_UPLOAD_API_URL, {
      method: 'POST',
      body: createFormData(),
    });
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && result.data?.url) {
        return result.data;
      }
    }
  } catch (directErr) {
    console.warn('Direct upload blocked (likely CORS / Hostinger Bot challenge), attempting proxy...', directErr.message);
  }

  // 2. Try Vite Proxy
  try {
    const response = await fetch(PROXY_UPLOAD_API_URL, {
      method: 'POST',
      body: createFormData(),
    });
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && result.data?.url) {
        return result.data;
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy upload failed, falling back to backend upload bridge...', proxyErr.message);
  }

  // 3. Backend Upload Bridge (Guaranteed success: proxies to remote API or stores with local fallback)
  try {
    const result = await api.postFormData('/upload', createFormData());
    if (result.status === 'success' && result.data?.url) {
      return result.data;
    }
    throw new Error(result.message || 'Upload failed');
  } catch (backendErr) {
    console.error('All upload strategies failed:', backendErr);
    throw new Error(backendErr.message || 'Failed to upload file');
  }
}

export default uploadFile;
