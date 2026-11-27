import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockOrganizations = vi.hoisted(() => ({
  uploadStagingImages: vi.fn(),
}))
vi.mock('@/lib/api/organizations', () => ({ organizationsApi: mockOrganizations }))

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
    <RegisterPhotosStep photos={initial} onChange={onChange} onBack={onBack} onContinue={onContinue} />
  )
  return { onChange, onContinue, onBack }
}

describe('web signup: photos step', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the type and size limits', () => {
    setup()
    expect(screen.getByText(/JPEG, PNG or WebP, up to 10 MB each/)).toBeInTheDocument()
  })

  it('minimum gate: Continue is disabled below 3 photos and enabled at 3', () => {
    const { onContinue } = setup(urls(MIN_PHOTOS - 1))
    const cont = screen.getByRole('button', { name: /Continue to Plans/ })
    expect(cont).toBeDisabled()
    expect(MIN_PHOTOS).toBe(3)
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

  it('upload: sends the files to the stateless route and adds the returned urls to the list', async () => {
    mockOrganizations.uploadStagingImages.mockResolvedValue({ data: { urls: ['https://cdn.test/new1.jpg', 'https://cdn.test/new2.jpg'] } })
    const { onChange } = setup(urls(1))
    const a = file('a.jpg')
    const b = file('b.png', 'image/png')
    fireEvent.change(screen.getByTestId('photo-input'), { target: { files: [a, b] } })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([...urls(1), 'https://cdn.test/new1.jpg', 'https://cdn.test/new2.jpg']))
    expect(mockOrganizations.uploadStagingImages).toHaveBeenCalledWith([a, b])
  })

  it('shows the server error message when the upload is rejected', async () => {
    mockOrganizations.uploadStagingImages.mockRejectedValue({
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
    expect(mockOrganizations.uploadStagingImages).not.toHaveBeenCalled()
  })

  it('maximum: refuses files beyond 10 and disables Add photos at 10', async () => {
    setup(urls(MAX_PHOTOS - 1))
    fireEvent.change(screen.getByTestId('photo-input'), { target: { files: [file('a.jpg'), file('b.jpg')] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(/add 1 more photo \(maximum 10\)/)
    expect(mockOrganizations.uploadStagingImages).not.toHaveBeenCalled()
  })

  it('Add photos is disabled once 10 are added', () => {
    setup(urls(MAX_PHOTOS))
    expect(screen.getByRole('button', { name: /Add photos/ })).toBeDisabled()
  })

  it('remove: only drops the url here; nothing is called on the server (A3 J12)', () => {
    const { onChange } = setup(urls(6))
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 2' }))
    expect(onChange).toHaveBeenCalledWith(urls(6).filter((_, i) => i !== 1))
    expect(mockOrganizations.uploadStagingImages).not.toHaveBeenCalled()
  })
})
