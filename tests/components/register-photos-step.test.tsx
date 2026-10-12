import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockTenants = vi.hoisted(() => ({
  uploadOnboardingImages: vi.fn(),
  replaceOnboardingImages: vi.fn(),
}))
vi.mock('@/lib/api/tenants', () => ({ tenantsApi: mockTenants }))

import {
  RegisterPhotosStep,
  MIN_PHOTOS,
  MAX_PHOTOS,
} from '@/components/features/register-photos-step'

const urls = (n: number) => Array.from({ length: n }, (_, i) => `https://cdn.test/${i + 1}.jpg`)
const file = (name: string, type = 'image/jpeg', size = 1024) => {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

function setup(initial: string[] = []) {
  const onChange = vi.fn()
  const onContinue = vi.fn()
  const onBack = vi.fn()
  render(
    <RegisterPhotosStep tenantId="t1" photos={initial} onChange={onChange} onBack={onBack} onContinue={onContinue} />
  )
  return { onChange, onContinue, onBack }
}

describe('web signup: photos step', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the type and size limits', () => {
    setup()
    expect(screen.getByText(/JPEG, PNG or WebP, up to 10 MB each/)).toBeInTheDocument()
  })

  it('minimum gate: Continue is disabled below 5 photos and enabled at 5', () => {
    const { onContinue } = setup(urls(MIN_PHOTOS - 1))
    const cont = screen.getByRole('button', { name: /Continue to Plans/ })
    expect(cont).toBeDisabled()
    expect(screen.getByText(/add at least 1 more to continue/)).toBeInTheDocument()
    fireEvent.click(cont)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('enables Continue at the minimum and calls onContinue', () => {
    const { onContinue } = setup(urls(MIN_PHOTOS))
    const cont = screen.getByRole('button', { name: /Continue to Plans/ })
    expect(cont).not.toBeDisabled()
    fireEvent.click(cont)
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('upload: POSTs the files for the tenant and hands back the server list', async () => {
    mockTenants.uploadOnboardingImages.mockResolvedValue({ data: { imagesJson: urls(2) } })
    const { onChange } = setup()
    const a = file('a.jpg')
    const b = file('b.png', 'image/png')
    fireEvent.change(screen.getByTestId('photo-input'), { target: { files: [a, b] } })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(urls(2)))
    expect(mockTenants.uploadOnboardingImages).toHaveBeenCalledWith('t1', [a, b])
  })

  it('shows the server error message when the upload is rejected', async () => {
    mockTenants.uploadOnboardingImages.mockRejectedValue({
      response: { data: { message: 'File size must not exceed 10 MB' } },
    })
    const { onChange } = setup()
    fireEvent.change(screen.getByTestId('photo-input'), { target: { files: [file('a.jpg')] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('File size must not exceed 10 MB')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects a wrong type and an oversize file client-side without calling the API', async () => {
    setup()
    fireEvent.change(screen.getByTestId('photo-input'), { target: { files: [file('doc.gif', 'image/gif')] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(/only JPEG, PNG and WebP/)

    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [file('huge.jpg', 'image/jpeg', 11 * 1024 * 1024)] },
    })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/must not exceed 10 MB/))
    expect(mockTenants.uploadOnboardingImages).not.toHaveBeenCalled()
  })

  it('maximum: refuses files beyond 10 and disables Add photos at 10', async () => {
    setup(urls(MAX_PHOTOS - 1))
    fireEvent.change(screen.getByTestId('photo-input'), { target: { files: [file('a.jpg'), file('b.jpg')] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(/add 1 more photo \(maximum 10\)/)
    expect(mockTenants.uploadOnboardingImages).not.toHaveBeenCalled()
  })

  it('Add photos is disabled once 10 are added', () => {
    setup(urls(MAX_PHOTOS))
    expect(screen.getByRole('button', { name: /Add photos/ })).toBeDisabled()
  })

  it('remove: PUTs the list without that photo, then updates', async () => {
    mockTenants.replaceOnboardingImages.mockResolvedValue({ data: { imagesJson: [] } })
    const { onChange } = setup(urls(6))
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 2' }))

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const expected = urls(6).filter((_, i) => i !== 1)
    expect(mockTenants.replaceOnboardingImages).toHaveBeenCalledWith('t1', expected)
    expect(onChange).toHaveBeenCalledWith(expected)
  })

  it('remove: keeps the photo and shows the server error when the PUT fails', async () => {
    mockTenants.replaceOnboardingImages.mockRejectedValue({ response: { data: { message: 'Tenant not found or access denied' } } })
    const { onChange } = setup(urls(6))
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 1' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tenant not found or access denied')
    expect(onChange).not.toHaveBeenCalled()
  })
})
