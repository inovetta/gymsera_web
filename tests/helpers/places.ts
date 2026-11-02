import { expect, vi } from 'vitest'
import { fireEvent, waitFor, within } from '@testing-library/react'
import { placesApi, PlaceDetails, PlaceKind } from '@/lib/api/places'

/**
 * A fake of our /places API (Phase 7 P3 shapes, gymsera_be places.service.js), the same as the CMS
 * fixture. Nothing reaches Google: the API holds the server key, and these tests stand in for the API.
 */
const ok = <T,>(data: T) => ({ success: true, message: 'ok', data })

export const LAHORE: PlaceDetails = {
  placeId: 'city-lahore', formattedAddress: 'Lahore, Pakistan', latitude: 31.5204, longitude: 74.3587,
  city: { id: 7, name: 'Lahore' }, area: null,
}
const SUGGESTIONS: Record<PlaceKind, { placeId: string; primaryText: string; secondaryText: string }[]> = {
  city: [{ placeId: 'city-lahore', primaryText: 'Lahore', secondaryText: 'Punjab, Pakistan' }],
  area: [],
  address: [],
}
const DETAILS: Record<string, PlaceDetails> = { 'city-lahore': LAHORE }

export const fakePlaces = () => ({
  autocomplete: vi.spyOn(placesApi, 'autocomplete').mockImplementation((async (q: { kind: PlaceKind; input: string }) =>
    ok({ suggestions: q.input.toLowerCase().startsWith('zz') ? [] : SUGGESTIONS[q.kind] })) as never),
  details: vi.spyOn(placesApi, 'details').mockImplementation((async (placeId: string) => ok(DETAILS[placeId])) as never),
})

/** Type into a Places field and pick the first suggestion. */
export const pickPlace = async (label: string, typed: string, option: RegExp, root: HTMLElement = document.body) => {
  const input = within(root).getByLabelText(label)
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: typed } })
  fireEvent.click(await within(root).findByRole('button', { name: option }))
  await waitFor(() => expect((input as HTMLInputElement).value).not.toBe(typed))
}
