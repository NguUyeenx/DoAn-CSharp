export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  role: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginDto {
  username: string;
  password:  string;
}

export interface RegisterDto {
  username:    string;
  email:       string;
  password:    string;
  displayName: string;
}

export interface OwnerDto {
  id:              number;
  username:        string;
  email:           string;
  displayName:     string;
  avatarUrl?:      string;
  defaultLanguage: string;
  createdAt:       string;
}

export interface AuthResponseDto {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    string;
  role:         string;
  owner:        OwnerDto;
}

export interface ChangePasswordDto {
  currentPassword:  string;
  newPassword:      string;
}

export interface UpdateProfileDto {
  displayName?:     string;
  email?:           string;
  avatarUrl?:       string;
  defaultLanguage?: string;
}

