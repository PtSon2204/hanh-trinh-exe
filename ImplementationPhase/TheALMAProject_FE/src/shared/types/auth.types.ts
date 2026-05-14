// ============================================================
// Auth Types - khớp với DTOs phía backend
// ============================================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface VerifyOtpDto {
  email: string;
  otpCode: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  resetToken: string;
  email: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface OAuthLoginDto {
  provider: string; // "Google" | "Facebook"
  idToken: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  expiration: string;
}

export interface UserSession {
  token: string;
  email: string;
  fullName: string;
  role: string;
}
