import axiosClient from '../../../shared/api/axiosClient';
import type {
  LoginDto,
  RegisterDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponse,
} from '../../../shared/types/auth.types';

const authApi = {
  /** POST /api/auth/register */
  register: (dto: RegisterDto) =>
    axiosClient.post<{ message: string }>('/auth/register', dto),

  /** POST /api/auth/verify-otp */
  verifyOtp: (dto: VerifyOtpDto) =>
    axiosClient.post<AuthResponse>('/auth/verify-otp', dto),

  /** POST /api/auth/resend-otp?email=xxx */
  resendOtp: (email: string) =>
    axiosClient.post<{ message: string }>(`/auth/resend-otp?email=${encodeURIComponent(email)}`),

  /** POST /api/auth/login */
  login: (dto: LoginDto) =>
    axiosClient.post<AuthResponse>('/auth/login', dto),

  /** POST /api/auth/logout */
  logout: () =>
    axiosClient.post<{ message: string }>('/auth/logout'),

  /** POST /api/auth/forgot-password */
  forgotPassword: (dto: ForgotPasswordDto) =>
    axiosClient.post<{ message: string }>('/auth/forgot-password', dto),

  /** POST /api/auth/reset-password */
  resetPassword: (dto: ResetPasswordDto) =>
    axiosClient.post<{ message: string }>('/auth/reset-password', dto),

  /** PUT /api/auth/change-password */
  changePassword: (dto: ChangePasswordDto) =>
    axiosClient.put<{ message: string }>('/auth/change-password', dto),
};

export default authApi;
