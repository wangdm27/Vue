import { http } from './http'
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '@/types/auth'

export const authApi = {
  login(payload: LoginRequest) {
    return http.post<unknown, AuthResponse>('/identity/auth/login', payload)
  },

  register(payload: RegisterRequest) {
    return http.post<unknown, AuthResponse>('/identity/auth/register', payload)
  },

  me() {
    return http.get<unknown, UserProfile>('/identity/auth/me')
  },
}
