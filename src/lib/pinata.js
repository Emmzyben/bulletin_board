import { PinataSDK } from 'pinata';

export const pinata = new PinataSDK({
  pinataJwt: "", // Intentionally empty, we use presigned URLs for upload
  pinataGateway: import.meta.env.VITE_GATEWAY_URL
});
