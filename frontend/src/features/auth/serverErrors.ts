import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError, type ErrorCode } from '@/shared/api/problems'

type FieldMessage = 'validation.required' | 'validation.email' | 'validation.username' | 'validation.passwordLength'
  | 'validation.privacy' | 'errors.EMAIL_IN_USE' | 'errors.USERNAME_IN_USE'

/** Message per field when the API rejects it (400 VALIDATION_FAILED or 409 *_IN_USE). */
const FIELD_MESSAGES: Record<string, Partial<Record<string, FieldMessage>>> = {
  email: { IN_USE: 'errors.EMAIL_IN_USE', default: 'validation.email' },
  username: { IN_USE: 'errors.USERNAME_IN_USE', default: 'validation.username' },
  password: { default: 'validation.passwordLength' },
  acceptedPrivacyNotice: { default: 'validation.privacy' },
}

/**
 * Marks on the form the fields the API rejected. Returns the code for a general message
 * when the error does not belong to a field (INVALID_CREDENTIALS, NETWORK_ERROR...), or null.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): ErrorCode | null {
  if (!(error instanceof ApiError)) return 'UNKNOWN'
  let marked = false
  for (const { field, code } of error.fieldErrors) {
    const messages = FIELD_MESSAGES[field]
    if (!messages || !fields.includes(field as Path<T>)) continue
    setError(field as Path<T>, { message: messages[code] ?? messages.default ?? 'validation.required' })
    marked = true
  }
  return marked ? null : error.code
}