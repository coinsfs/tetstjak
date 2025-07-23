export const API_BASE_URL = 'http://localhost:8000/api/v1';
export const IMAGE_BASE_URL = 'https://pub-5e4bcde41b9c4448ab189ac2f8100325.r2.dev';

export const getProfileImageUrl = (profilePictureUrl: string | null): string | null => {
  if (!profilePictureUrl) return null;
  return `${IMAGE_BASE_URL}/${profilePictureUrl}`;
};