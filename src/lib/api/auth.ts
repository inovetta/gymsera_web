import apiClient from './client'
import { ApiResponse, User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface OTPPayload {
  email: string
  code: string
}

export interface ResendOTPPayload {
  email: string
}

export interface PasswordResetPayload {
  email: string
}

export interface ConfirmPasswordResetPayload {
  email: string
  otp: string
  newPassword: string
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await apiClient.post('/auth/login', payload)
    return data
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.post('/auth/register', payload)
    return data
  },

  verifyOTP: async (payload: OTPPayload): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await apiClient.post('/auth/otp/verify', payload)
    return data
  },

  resendOTP: async (payload: ResendOTPPayload): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.post('/auth/otp/resend', payload)
    return data
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/auth/logout')
    return data
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken })
    return data
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  requestPasswordReset: async (payload: PasswordResetPayload): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/auth/password-reset/request', payload)
    return data
  },

  confirmPasswordReset: async (payload: ConfirmPasswordResetPayload): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/auth/password-reset/confirm', payload)
    return data
  },
}
