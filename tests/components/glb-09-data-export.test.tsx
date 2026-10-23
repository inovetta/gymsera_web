import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrivacyPolicyPage from '@/app/(public)/privacy/page'
import { DataExportCard } from '@/components/features/data-export-card'

const getDataExport = vi.fn()
vi.mock('@/lib/api/me', () => ({ meApi: { getDataExport: (...a: unknown[]) => getDataExport(...a) } }))

// GLB-09 (spec §14 R-44): people can get a copy of their data, and the privacy page says where.
describe('privacy page: data export', () => {
  it('tells people they can download their data and links to where', () => {
    render(<PrivacyPolicyPage />)
    const item = screen.getByText(/Data Export:/i).closest('li')!
    expect(item.textContent).toMatch(/JSON/)
    expect(item.textContent).toMatch(/Settings/)
    const link = item.querySelector('a[href="/profile?tab=data"]')
    expect(link).not.toBeNull()
  })
})

describe('DataExportCard', () => {
  const download = vi.fn()
  beforeEach(() => {
    getDataExport.mockReset()
    download.mockReset()
  })

  it('asks the API for the export and downloads it as a dated JSON file', async () => {
    getDataExport.mockResolvedValue({ account: { email: 'a@b.test' }, complete: true })
    render(<DataExportCard download={download} now={() => new Date('2026-12-01T09:00:00Z')} />)

    fireEvent.click(screen.getByRole('button', { name: /download my data/i }))

    await waitFor(() => expect(download).toHaveBeenCalledTimes(1))
    const [filename, json] = download.mock.calls[0]
    expect(filename).toBe('gymsera-my-data-2026-12-01.json')
    expect(JSON.parse(json).account.email).toBe('a@b.test')
    expect(json).toContain('\n  "account"')
  })

  it('a failed export shows the shared error state with Retry and downloads nothing', async () => {
    getDataExport.mockRejectedValueOnce({ response: { status: 503, data: { error: { message: 'Service unavailable', requestId: 'req_x1' } } } })
    render(<DataExportCard download={download} />)

    fireEvent.click(screen.getByRole('button', { name: /download my data/i }))

    expect(await screen.findByText(/req_x1/)).toBeInTheDocument()
    expect(download).not.toHaveBeenCalled()

    getDataExport.mockResolvedValueOnce({ complete: true })
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1))
  })

  it('warns when the file is incomplete', async () => {
    getDataExport.mockResolvedValue({ complete: false, unavailable: [{ tenantId: 't1', gymName: 'Iron Gym' }] })
    render(<DataExportCard download={download} />)

    fireEvent.click(screen.getByRole('button', { name: /download my data/i }))

    expect(await screen.findByText(/Iron Gym/)).toBeInTheDocument()
    expect(screen.getByText(/incomplete/i)).toBeInTheDocument()
  })
})
