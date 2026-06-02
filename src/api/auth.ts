import { requestFirst, isRecord, pickRecord, pickString, toStringArray } from './compat'
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '@/types/auth'

const authEndpoints = {
  login: ['/auth/login', '/identity/auth/login'],
  register: ['/auth/register', '/identity/auth/register'],
  me: ['/auth/me', '/identity/auth/me'],
}

export const authApi = {
  async login(payload: LoginRequest) {
    const response = await requestFirst<unknown>('post', authEndpoints.login, { data: payload })
    return normalizeAuthResponse(response)
  },

  async register(payload: RegisterRequest) {
    const response = await requestFirst<unknown>('post', authEndpoints.register, { data: payload })
    return normalizeAuthResponse(response)
  },

  async me() {
    const response = await requestFirst<unknown>('get', authEndpoints.me)
    return normalizeUserProfile(response)
  },
}

function normalizeAuthResponse(payload: unknown): AuthResponse {
  if (!isRecord(payload)) {
    throw new Error('登录响应格式无效')
  }

  const user = pickRecord(payload, 'user', 'profile', 'currentUser')
  const tenant = pickRecord(payload, 'tenant', 'currentTenant')

  return {
    userId: pickString(payload, 'userId', 'id', 'sub') || pickString(user, 'userId', 'id'),
    tenantId: pickString(payload, 'tenantId') || pickString(tenant, 'tenantId', 'id'),
    tenantCode: pickString(payload, 'tenantCode') || pickString(tenant, 'tenantCode', 'code'),
    userName: pickString(payload, 'userName', 'username', 'name') || pickString(user, 'userName', 'username', 'name'),
    displayName: pickString(payload, 'displayName', 'fullName') || pickString(user, 'displayName', 'fullName'),
    email: pickString(payload, 'email') || pickString(user, 'email'),
    accessToken: pickString(payload, 'accessToken', 'token', 'jwt', 'jwtToken'),
    expiresAt: pickString(payload, 'expiresAt', 'expiration', 'expires'),
    roles: toStringArray(payload.roles ?? user.roles),
    permissions: toStringArray(payload.permissions ?? user.permissions),
  }
}

function normalizeUserProfile(payload: unknown): UserProfile {
  if (!isRecord(payload)) {
    throw new Error('用户资料响应格式无效')
  }

  const user = pickRecord(payload, 'user', 'profile', 'currentUser')
  const tenant = pickRecord(payload, 'tenant', 'currentTenant')

  return {
    userId: pickString(payload, 'userId', 'id', 'sub') || pickString(user, 'userId', 'id'),
    userName: pickString(payload, 'userName', 'username', 'name') || pickString(user, 'userName', 'username', 'name'),
    displayName: pickString(payload, 'displayName', 'fullName') || pickString(user, 'displayName', 'fullName'),
    email: pickString(payload, 'email') || pickString(user, 'email'),
    tenantId: pickString(payload, 'tenantId') || pickString(tenant, 'tenantId', 'id'),
    tenantCode: pickString(payload, 'tenantCode') || pickString(tenant, 'tenantCode', 'code'),
    roles: toStringArray(payload.roles ?? user.roles),
    permissions: toStringArray(payload.permissions ?? user.permissions),
  }
}
