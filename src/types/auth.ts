export interface LoginRequest {
  tenantCode: string
  userName: string
  password: string
}

export interface RegisterRequest {
  tenantCode: string
  userName: string
  email: string
  displayName: string
  password: string
}

export interface AuthResponse {
  userId: string
  tenantId: string
  tenantCode: string
  userName: string
  displayName: string
  email: string
  accessToken: string
  expiresAt: string
  roles: string[]
  permissions: string[]
}

export interface UserProfile {
  userId: string
  userName: string
  displayName: string
  email: string
  tenantId: string
  tenantCode: string
  roles: string[]
  permissions: string[]
}
