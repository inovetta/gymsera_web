import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import fs from 'fs'
import path from 'path'

/**
 * Phase 7 P9c (C): the branch page showed Google's "This page can't load Google Maps correctly".
 * Checked on gymsera.com 2026-11-05: the key loads (no gm_authFailure, tiles load); the only error
 * is "The map is initialized without a valid Map ID, which will prevent use of Advanced Markers",
 * and a plain marker on the same page gives no dialog. So: classic Marker, and when the map cannot
 * load at all (FAILED / AUTH_FAILURE / no key) nothing is drawn and the page hides the map.
 */
const state = vi.hoisted(() => ({ status: 'LOADED' as string, onError: null as null | (() => void) }))

vi.mock('@vis.gl/react-google-maps', () => ({
  APILoadingStatus: { NOT_LOADED: 'NOT_LOADED', LOADING: 'LOADING', LOADED: 'LOADED', FAILED: 'FAILED', AUTH_FAILURE: 'AUTH_FAILURE' },
  APIProvider: ({ children, onError }: { children: React.ReactNode; onError?: () => void }) => {
    state.onError = onError ?? null
    return <div data-testid="api-provider">{children}</div>
  },
  useApiLoadingStatus: () => state.status,
  Map: ({ children, mapId }: { children: React.ReactNode; mapId?: string }) => (
    <div data-testid="google-map" data-map-id={mapId ?? ''}>{children}</div>
  ),
  Marker: () => <div data-testid="classic-marker" />,
  AdvancedMarker: () => <div data-testid="advanced-marker" />,
  Pin: () => null,
}))

const load = async (key: string) => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', key)
  return (await import('@/components/features/gym-map')).GymMap
}

describe('GymMap (P9c C)', () => {
  beforeEach(() => {
    state.status = 'LOADED'
    state.onError = null
  })

  it('draws the map with a classic marker, which needs no Map ID (no Advanced Marker without one)', async () => {
    const GymMap = await load('web-key')
    render(<GymMap latitude={34.01} longitude={71.52} title="Main" />)
    expect(screen.getByTestId('google-map')).toBeInTheDocument()
    expect(screen.getByTestId('classic-marker')).toBeInTheDocument()
    expect(screen.queryByTestId('advanced-marker')).toBeNull()
  })

  it.each(['AUTH_FAILURE', 'FAILED'])('%s: nothing is drawn and the page is told', async (status) => {
    state.status = status
    const onUnavailable = vi.fn()
    const GymMap = await load('web-key')
    render(<GymMap latitude={34.01} longitude={71.52} onUnavailable={onUnavailable} />)
    expect(screen.queryByTestId('google-map')).toBeNull()
    expect(onUnavailable).toHaveBeenCalled()
  })

  it('the script failing to load tells the page', async () => {
    const onUnavailable = vi.fn()
    const GymMap = await load('web-key')
    render(<GymMap latitude={34.01} longitude={71.52} onUnavailable={onUnavailable} />)
    state.onError?.()
    expect(onUnavailable).toHaveBeenCalled()
  })

  it('no key in the build: no Google map, the NEW-140 notice, and the page is told', async () => {
    const onUnavailable = vi.fn()
    const GymMap = await load('')
    render(<GymMap latitude={34.01} longitude={71.52} onUnavailable={onUnavailable} />)
    expect(screen.queryByTestId('api-provider')).toBeNull()
    expect(screen.getByText('The map is not available here.')).toBeInTheDocument()
    expect(onUnavailable).toHaveBeenCalled()
  })

  it('guard: every Advanced Marker in src/ sits on a map with a mapId', () => {
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx$/.test(e.name) ? [path.join(dir, e.name)] : []
      )
    const offenders = walk(path.join(__dirname, '../../src')).filter((f) => {
      const src = fs.readFileSync(f, 'utf8')
      return /<AdvancedMarker\b/.test(src) && !/mapId=/.test(src)
    })
    expect(offenders).toEqual([])
  })
})
