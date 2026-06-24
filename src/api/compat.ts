import { http } from './http'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type RequestConfig = {
  params?: Record<string, unknown>
  data?: unknown
}

/** 单路径请求 — API路径已固定，不再需要多路径fallback */
export async function request<T>(method: HttpMethod, url: string, config: RequestConfig = {}): Promise<T> {
  return http.request<unknown, T>({
    url,
    method,
    params: config.params,
    data: config.data,
  } as any)
}

/**
 * 向后兼容：仍接受 string[] 但只用第一个元素。
 * 已有调用方逐步迁移到 request() 后可删除。
 */
export async function requestFirst<T>(method: HttpMethod, urls: string[], config: RequestConfig = {}): Promise<T> {
  const url = urls[0]!
  return request<T>(method, url, config)
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
