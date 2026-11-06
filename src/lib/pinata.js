import { uploadFile, UPLOAD_API_URL } from './upload';

/**
 * Backward-compatible adapter for Pinata calls, redirecting all uploads
 * directly to the Crystals Business Solution file upload API.
 */
export const pinata = {
  upload: {
    public: {
      file: (file) => ({
        url: async () => {
          const data = await uploadFile(file);
          return { cid: data.url };
        }
      })
    }
  },
  gateways: {
    public: {
      convert: async (cidOrUrl) => cidOrUrl
    }
  }
};

export { uploadFile, UPLOAD_API_URL };
