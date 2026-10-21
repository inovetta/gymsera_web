import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }))
const mockAuth = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
}))
vi.mock('@/lib/api/auth', () => ({ authApi: mockAuth }))

import ForgotPasswordPage from '@/app/auth/forgot-password/page'

// The server contract is POST /auth/password-reset/confirm { email, code, password }
// (gymsera_be src/validators/auth.validator.js passwordResetConfirm; the mobile app sends the same).
describe('web forgot-password: confirm step sends the field names the API validates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.requestPasswordReset.mockResolvedValue({ success: true })
    mockAuth.confirmPasswordReset.mockResolvedValue({ success: true })
  })

  it('posts { email, code, password } and nothing else', async () => {
    render(<ForgotPasswordPage />)
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'host@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }))
    await waitFor(() => expect(screen.getByText(/enter the code sent to/i)).toBeTruthy())

    const digitInputs = screen.getAllByRole('textbox')
    fireEvent.paste(digitInputs[0], { clipboardData: { getData: () => '123456' } })
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: 'Str0ng!pass' } })
    fireEvent.change(screen.getByPlaceholderText('Repeat new password'), { target: { value: 'Str0ng!pass' } })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => expect(mockAuth.confirmPasswordReset).toHaveBeenCalledTimes(1))
    expect(mockAuth.confirmPasswordReset).toHaveBeenCalledWith({
      email: 'host@example.com',
      code: '123456',
      password: 'Str0ng!pass',
    })
  })
})
