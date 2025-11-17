import { UploadMeClient } from '@weirdlookingjay/uploadme-node';

const apiKey = process.env.UPLOADME_API_KEY;

if (!apiKey) {
  throw new Error('UPLOADME_API_KEY is not set');
}

export const uploadMeClient = new UploadMeClient({
  apiKey,
  apiUrl: process.env.UPLOADME_API_URL,
});
