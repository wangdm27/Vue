import { http } from './http'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type RequestConfig = {
  params?: Record<string, unknown>
  data?: unknown
}

export async function requestFirst<T>(method: HttpMethod, urls: string[], config: RequestConfig = {}) {
  let lastError: unknown

  for (const [index, url] of urls.entries()) {
    try {
      return await http.request<unknown, T>({
        url,
        method,
        params: config.params,
        data: config.data,
        suppressError: index < urls.length - 1,
      } as any)
    } catch (error) {
      lastError = error

      if (index === urls.length - 1 || !canTryNextEndpoint(error)) {
        throw error
      }
    }
  }

  throw lastError
}

export function getArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const candidates = [payload.items, payload.records, payload.rows, payload.list, payload.data]
  const arrayPayload = candidates.find(Array.isArray)

  return (arrayPayload ?? []) as T[]
}

export function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    if (typeof item === 'string') {
      return item
    }

    if (isRecord(item)) {
      return String(item.code ?? item.name ?? item.roleCode ?? item.permissionCode ?? item.id ?? '')
    }

    return String(item)
  }).filter(Boolean)
}

export function pickString(source: Record<string, any>, ...keys: string[]) {
  const value = pickValue(source, ...keys)
  return value == null ? '' : String(value)
}

export function pickBoolean(source: Record<string, any>, fallback: boolean, ...keys: string[]) {
  const value = pickValue(source, ...keys)
  return typeof value === 'boolean' ? value : fallback
}

export function pickNumber(source: Record<string, any>, fallback: number, ...keys: string[]) {
  const value = pickValue(source, ...keys)
  return typeof value === 'number' ? value : fallback
}

export function pickRecord(source: Record<string, any>, ...keys: string[]) {
  const value = pickValue(source, ...keys)
  return isRecord(value) ? value : source
}

export function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

function pickValue(source: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key]
    }
  }

  return undefined
}

function canTryNextEndpoint(error: any) {
  const status = error.response?.status
  if (status === 400) {
    const message = error.response?.data?.message ?? ''
    return typeof message === 'string' && message.includes('No route matches')
  }
  return status === 404 || status === 405 || status === 501
}
