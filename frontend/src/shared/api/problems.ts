import type { components } from './schema'

/** RFC 9457 error as the contract defines it. */
export type Problem = components['schemas']['Problem']

/** Contract codes plus the two that only exist in the browser. */
export type ErrorCode = Problem['code'] | 'NETWORK_ERROR' | 'UNKNOWN'

/** Error thrown by every query; the UI decides the text from `code`. */
export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number | null
  readonly problem: Problem | null

  constructor(code: ErrorCode, status: number | null, problem: Problem | null) {
    super(problem?.detail ?? code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.problem = problem
  }

  /** Errors per field (VALIDATION_FAILED, EMAIL_IN_USE...) for the forms. */
  get fieldErrors(): NonNullable<Problem['errors']> {
    return this.problem?.errors ?? []
  }
}

export function isProblem(value: unknown): value is Problem {
  return typeof value === 'object' && value !== null && 'code' in value && 'status' in value
}

/** Turns whatever a request threw or returned as `error` into an ApiError. */
export function toApiError(error: unknown, status: number | null = null): ApiError {
  if (error instanceof ApiError) return error
  if (isProblem(error)) return new ApiError(error.code, error.status, error)
  if (error instanceof TypeError) return new ApiError('NETWORK_ERROR', null, null) // fetch without network
  return new ApiError('UNKNOWN', status, null)
}