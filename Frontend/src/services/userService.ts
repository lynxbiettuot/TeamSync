// Service tương tác API người dùng: tải lên ảnh đại diện lên Cloudinary và cập nhật thông tin cá nhân
import { apiClient } from './apiClient';
import type { User } from '../types/auth.types';

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: User;
}

export const userService = {
  // POST /api/users/avatar — Tải lên ảnh đại diện (MultipartFile)
  async uploadAvatar(file: File): Promise<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<UploadAvatarResponse>('/api/users/avatar', formData);
  },
};
