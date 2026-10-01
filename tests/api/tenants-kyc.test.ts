import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '@/lib/api/client'
import { tenantsApi } from '@/lib/api/tenants'

vi.mock('@/lib/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('Web tenantsApi KYC document upload (SEC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts multipart form-data to /tenants/:id/kyc-documents with files and optional documentType', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          kycDocuments: [
            { id: 'kyc-1', name: 'gym_license.pdf', size: 1024 },
            { id: 'kyc-2', name: 'cnic_front.jpg', size: 2048 },
          ],
        },
      },
    }

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

    const file1 = new File(['dummy content 1'], 'gym_license.pdf', { type: 'application/pdf' })
    const file2 = new File(['dummy content 2'], 'cnic_front.jpg', { type: 'image/jpeg' })

    const res = await tenantsApi.uploadKycDocuments('tenant-xyz', [file1, file2], 'BUSINESS_REGISTRATION')

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, formData, config] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/tenants/tenant-xyz/kyc-documents')
    expect(config?.headers?.['Content-Type']).toBe('multipart/form-data')
    expect(formData).toBeInstanceOf(FormData)
    expect((formData as FormData).get('documentType')).toBe('BUSINESS_REGISTRATION')

    const docs = (formData as FormData).getAll('documents')
    expect(docs).toHaveLength(2)
    expect(res).toEqual(mockResponse.data)
  })
})
