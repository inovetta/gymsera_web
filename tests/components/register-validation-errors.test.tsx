import { describe, it, expect } from 'vitest'
import { extractValidationErrorMessage, extractFieldErrors } from '@/lib/utils'

describe('422 Validation Error extraction (UX-01 / UX-07 / UX-15 PR 2)', () => {
  it('extracts field-level message from data.errors array instead of "Validation failed"', () => {
    const errorResponse = {
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Validation failed',
          code: 'validation_error',
          errors: [
            { field: 'phone', message: 'A valid phone number is required' }
          ]
        }
      }
    }

    const message = extractValidationErrorMessage(errorResponse, 'Registration failed')
    expect(message).toBe('A valid phone number is required')
    expect(message).not.toBe('Validation failed')
  })

  it('extracts field-level message from data.error.details.errors array', () => {
    const errorResponse = {
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Validation failed',
          error: {
            code: 'validation_error',
            message: 'Validation failed',
            details: {
              errors: [
                { field: 'email', message: 'Email address is already in use' }
              ]
            }
          }
        }
      }
    }

    const message = extractValidationErrorMessage(errorResponse, 'Registration failed')
    expect(message).toBe('Email address is already in use')
    expect(message).not.toBe('Validation failed')
  })

  it('joins multiple field errors when multiple fields fail validation', () => {
    const errorResponse = {
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Validation failed',
          errors: [
            { field: 'email', message: 'Email address is already in use' },
            { field: 'phone', message: 'A valid phone number is required' }
          ]
        }
      }
    }

    const message = extractValidationErrorMessage(errorResponse, 'Registration failed')
    expect(message).toBe('Email address is already in use. A valid phone number is required')
  })

  it('extractFieldErrors maps array of field names and messages for form bindings', () => {
    const errorResponse = {
      response: {
        status: 422,
        data: {
          errors: [
            { field: 'phone', message: 'A valid phone number is required' },
            { field: 'fullName', message: 'Full name is required' }
          ]
        }
      }
    }

    const fieldErrors = extractFieldErrors(errorResponse)
    expect(fieldErrors).toEqual([
      { field: 'phone', message: 'A valid phone number is required' },
      { field: 'fullName', message: 'Full name is required' }
    ])
  })

  it('falls back to non-generic backend message when not a validation_error', () => {
    const errorResponse = {
      response: {
        status: 400,
        data: {
          message: 'Invalid or expired OTP code'
        }
      }
    }

    const message = extractValidationErrorMessage(errorResponse, 'Fallback')
    expect(message).toBe('Invalid or expired OTP code')
  })
})
