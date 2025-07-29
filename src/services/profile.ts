import { BaseService } from './base';

export interface UpdateProfileRequest {
  email: string;
  profile: {
    phone_number: string;
    address: string;
  };
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface UploadPictureResponse {
  profile_picture_url: string;
  message: string;
}

class ProfileService extends BaseService {
  async updateProfile(token: string, data: UpdateProfileRequest): Promise<any> {
    return this.put('/users/me', data, token);
  }

  async changePassword(token: string, data: ChangePasswordRequest): Promise<void> {
    return this.post('/users/me/change-password', data, token);
  }

  async uploadProfilePicture(token: string, file: File): Promise<UploadPictureResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/profiles/me/upload-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Failed to upload profile picture');
    }

    return response.json();
  }
}

export const profileService = new ProfileService();