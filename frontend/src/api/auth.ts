import { api } from './client';
import type {
  AdminLoginRequest,
  AdminAuthResponse,
  RefreshTokenRequest,
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from '@/types/auth';

export const authApi = {
  adminLogin: (data: AdminLoginRequest) =>
    api.post<AdminAuthResponse>('/auth/admin/login', data),

  refreshToken: (data: RefreshTokenRequest) =>
    api.post<AdminAuthResponse>('/auth/refresh', data),

  ownerRegister: (data: RegisterDto) =>
    api.post<AuthResponseDto>('/auth/register', data),

  ownerLogin: (data: LoginDto) =>
    api.post<AuthResponseDto>('/auth/login', data),

  changePassword: (data: ChangePasswordDto) =>
    api.put('/auth/change-password', data),

  updateProfile: (data: UpdateProfileDto) =>
    api.put('/auth/profile', data),

  ownerPayFee: (data: { username: string; cardNumber: string; cardHolder: string }) =>
    api.post('/auth/owner/pay-fee', data),
};

