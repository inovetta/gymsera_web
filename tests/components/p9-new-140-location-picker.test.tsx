import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * Phase 7 P9, NEW-140 (website): place search goes through our API with the server key (as in P3);
 * the web key only draws the map. Before: the registration's LocationPicker loaded Google's Places
 * Autocomplete and Geocoder in the browser with the web key (`useMapsLibrary('places' | 'geocoding')`),
 * and without a key it told the visitor to "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY".
 */
const libraries: string[] = []
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: any) => <div data-testid="maps-provider">{children}</div>,
  Map: ({ children, onClick }: any) => (
    <div data-testid="map">
      <button type="button" onClick={() => onClick?.({ detail: { latLng: { lat: 31.4, lng: 74.2 } } })}>map click</button>
      {children}
    </div>
  ),
  Marker: () => <div data-testid="pin" />,
  AdvancedMarker: () => <div data-testid="pin" />,
  Pin: () => null,
  useMap: () => null,
  useMapsLibrary: (name: string) => { libraries.push(name); return null },
}))

const ok = (data: unknown) => ({ success: true, message: 'ok', data })
const ADDRESS = {
  placeId: 'addr-mm-alam', formattedAddress: '12 MM Alam Road, Gulberg III, Lahore', latitude: 31.5101, longitude: 74.3442,
  city: { id: 7, name: 'Lahore' }, area: { id: 71, name: 'Gulberg III' },
}

let autocomplete: ReturnType<typeof vi.spyOn>
let details: ReturnType<typeof vi.spyOn>
let reverse: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  libraries.length = 0
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

// The picker reads the key when its module loads, so each test loads it fresh; the spies go on the
// same fresh copy of lib/api/places that the picker imports.
const load = async (key: string) => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', key)
  const { placesApi } = await import('@/lib/api/places')
  autocomplete = vi.spyOn(placesApi, 'autocomplete').mockResolvedValue(ok({
    suggestions: [{ placeId: 'addr-mm-alam', primaryText: '12 MM Alam Road', secondaryText: 'Gulberg III, Lahore' }],
  }) as never)
  details = vi.spyOn(placesApi, 'details').mockResolvedValue(ok(ADDRESS) as never)
  reverse = vi.spyOn(placesApi, 'reverseGeocode').mockResolvedValue(ok(ADDRESS) as never)
  return (await import('@/components/features/location-picker')).LocationPicker
}

const setup = async (key = 'web-key') => {
  const LocationPicker = await load(key)
  const onLocationChange = vi.fn()
  const onAddressChange = vi.fn()
  const onPlaceChange = vi.fn()
  render(
    <LocationPicker value={null} address="" cityId={7} onLocationChange={onLocationChange} onAddressChange={onAddressChange} onPlaceChange={onPlaceChange} />
  )
  return { onLocationChange, onAddressChange, onPlaceChange }
}

describe('NEW-140: the registration location picker', () => {
  it('searches the address through /places (server key) and fills the point, address and place id', async () => {
    const { onLocationChange, onAddressChange, onPlaceChange } = await setup()
    const input = screen.getByRole('combobox', { name: /gym address/i })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '12 MM' } })
    fireEvent.click(await screen.findByRole('button', { name: /12 MM Alam Road/ }))

    await waitFor(() => expect(onLocationChange).toHaveBeenCalledWith({ lat: 31.5101, lng: 74.3442 }))
    expect(autocomplete).toHaveBeenCalledWith(expect.objectContaining({ input: '12 MM', kind: 'address', cityId: 7 }))
    expect(details).toHaveBeenCalledWith('addr-mm-alam', expect.objectContaining({ kind: 'address' }))
    expect(onAddressChange).toHaveBeenLastCalledWith('12 MM Alam Road, Gulberg III, Lahore')
    expect(onPlaceChange).toHaveBeenLastCalledWith('addr-mm-alam')
  })

  it('never loads Google Places or the Geocoder in the browser', async () => {
    await setup()
    expect(libraries).not.toContain('places')
    expect(libraries).not.toContain('geocoding')
  })

  it('"Use my location" reverse-geocodes through our API', async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 31.51, longitude: 74.34 } } as GeolocationPosition))
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
    const { onLocationChange, onAddressChange } = await setup()
    fireEvent.click(screen.getByRole('button', { name: /use my location/i }))
    await waitFor(() => expect(reverse).toHaveBeenCalledWith(31.51, 74.34))
    expect(onLocationChange).toHaveBeenLastCalledWith({ lat: 31.5101, lng: 74.3442 })
    expect(onAddressChange).toHaveBeenLastCalledWith('12 MM Alam Road, Gulberg III, Lahore')
  })

  it('a click on the map moves the pin only; no lookup is billed for it', async () => {
    const { onLocationChange } = await setup()
    fireEvent.click(screen.getByRole('button', { name: 'map click' }))
    expect(onLocationChange).toHaveBeenLastCalledWith({ lat: 31.4, lng: 74.2 })
    expect(reverse).not.toHaveBeenCalled()
  })

  it('without the web key: search still works, and the visitor never sees a setting name', async () => {
    await setup('')
    expect(screen.queryByTestId('map')).toBeNull()
    expect(screen.getByRole('combobox', { name: /gym address/i })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/NEXT_PUBLIC|API_KEY/)
  })
})

describe('NEW-140: the public gym map', () => {
  it('without the web key it says the map is not available, with no setting name', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '')
    const { GymMap } = await import('@/components/features/gym-map')
    render(<GymMap latitude={31.5} longitude={74.3} />)
    expect(document.body.textContent).toMatch(/map is not available/i)
    expect(document.body.textContent).not.toMatch(/NEXT_PUBLIC|API_KEY/)
  })
})
