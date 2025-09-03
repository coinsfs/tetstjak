export const API_BASE_URL = 'https://testing.cigarverse.space/api/v1';
export const IMAGE_BASE_URL = 'https://cdn.cigarverse.space';

export const getProfileImageUrl = (profilePictureUrl: string | null): string | null => {
  if (!profilePictureUrl) return null;
  return `${IMAGE_BASE_URL}/${profilePictureUrl}`;
};
