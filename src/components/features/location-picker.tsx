'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { APIProvider, Map, Marker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps'
import { Loader2, MapPin, Navigation, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { newPlacesSession, placesApi, PlaceSuggestion } from '@/lib/api/places'

export interface LatLng { lat: number; lng: number }

export interface LocationPickerProps {
  value: LatLng | null
  address: string
  onLocationChange: (location: LatLng) => void
  onAddressChange: (address: string) => void
  /** The Google place the address was picked from (null once the host types it by hand). */
  onPlaceChange?: (placeId: string | null) => void
  /** The city the gym is in: biases the address search to it. */
  cityId?: number | null
  className?: string
  height?: string
  placeholder?: string
  /** Accessible name of the search field. */
  label?: string
  mapId?: string
}

// Phase 7 P9 (NEW-140): the address search and "Use my location" go through our API (/places, server
// key), as the mobile app does since P3. The web key (Maps JavaScript API only) just draws the map.
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
const DEBOUNCE_MS = 300
// No pin yet: the whole country, not an invented city.
const COUNTRY_VIEW = { center: { lat: 30.3753, lng: 69.3451 }, zoom: 5 }

const requestError = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: { message?: string } } }
  if (!e?.response) return 'Could not reach the server. Check your connection and try again.'
  return e.response.data?.message || fallback
}

function FollowPin({ value }: { value: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !value) return
    map.panTo(value)
    map.setZoom(17)
  }, [map, value?.lat, value?.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function LocationPicker({
  value, address, onLocationChange, onAddressChange, onPlaceChange, cityId, className,
  height = '280px', placeholder = 'Search address or place…', label = 'Gym address',
}: LocationPickerProps) {
  const inputId = useId()
  const [text, setText] = useState(address)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const session = useRef(newPlacesSession())
  const typed = useRef(false)
  const request = useRef(0)

  useEffect(() => { if (!typed.current) setText(address) }, [address])

  useEffect(() => {
    if (!typed.current) return
    const input = text.trim()
    if (input.length < 2) { setSuggestions([]); return }
    const mine = ++request.current
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await placesApi.autocomplete({ input, kind: 'address', sessionToken: session.current, cityId: cityId ?? undefined })
        if (mine === request.current) { setSuggestions(res.data?.suggestions ?? []); setError(null) }
      } catch (err) {
        if (mine === request.current) { setSuggestions([]); setError(requestError(err, 'Location search is not available right now. Please try again.')) }
      } finally {
        if (mine === request.current) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, cityId])

  const pick = async (s: PlaceSuggestion) => {
    setError(null)
    try {
      const res = await placesApi.details(s.placeId, { kind: 'address', sessionToken: session.current, cityId: cityId ?? undefined })
      const place = res.data
      const shown = place.formattedAddress || s.primaryText
      typed.current = false
      setText(shown)
      setOpen(false)
      setSuggestions([])
      onAddressChange(shown)
      onPlaceChange?.(place.placeId)
      if (place.latitude != null && place.longitude != null) onLocationChange({ lat: place.latitude, lng: place.longitude })
    } catch (err) {
      setError(requestError(err, 'We could not use that place. Please pick another one.'))
    } finally {
      session.current = newPlacesSession()
    }
  }

  const locateMe = () => {
    setError(null)
    if (!navigator.geolocation) { setError('This browser cannot share its location. Search for the address instead.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await placesApi.reverseGeocode(coords.latitude, coords.longitude)
          const place = res.data
          typed.current = false
          if (place.formattedAddress) { setText(place.formattedAddress); onAddressChange(place.formattedAddress) }
          onPlaceChange?.(place.placeId)
          onLocationChange({ lat: place.latitude ?? coords.latitude, lng: place.longitude ?? coords.longitude })
        } catch (err) {
          setError(requestError(err, 'We could not find an address here. Please type it instead.'))
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setError(err.code === err.PERMISSION_DENIED
          ? 'Location is blocked for this site. Allow it in the browser settings, or search for the address.'
          : 'We could not get your location. Search for the address instead.')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const placePin = (e: MapMouseEvent | { latLng?: google.maps.LatLng | null }) => {
    const ll = 'detail' in e ? e.detail.latLng : e.latLng ? { lat: e.latLng.lat(), lng: e.latLng.lng() } : null
    if (ll) onLocationChange({ lat: ll.lat, lng: ll.lng })
  }

  const showList = open && text.trim().length >= 2 && !loading && suggestions.length > 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            id={inputId}
            role="combobox"
            aria-label={label}
            aria-expanded={showList}
            aria-controls={`${inputId}-list`}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={placeholder}
            value={text}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => {
              typed.current = true
              setText(e.target.value)
              setOpen(true)
              onAddressChange(e.target.value)
              onPlaceChange?.(null)
            }}
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-9 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 placeholder:text-muted-foreground"
          />
          {loading && <Loader2 aria-label="Searching" className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
          {showList && (
            <ul id={`${inputId}-list`} role="listbox" className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
              {suggestions.map((s) => (
                <li key={s.placeId} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                  >
                    <span className="font-medium">{s.primaryText}</span>
                    {s.secondaryText && <span className="ml-1 text-muted-foreground">{s.secondaryText}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          title="Use my location"
          aria-label="Use my location"
          className="h-10 w-10 shrink-0 rounded-lg border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      {MAPS_KEY ? (
        <APIProvider apiKey={MAPS_KEY}>
          <div className="relative rounded-xl overflow-hidden border shadow-sm">
            <Map
              defaultCenter={value ?? COUNTRY_VIEW.center}
              defaultZoom={value ? 16 : COUNTRY_VIEW.zoom}
              gestureHandling="cooperative"
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              zoomControl
              onClick={placePin}
              style={{ width: '100%', height }}
            >
              {value && <Marker position={value} draggable onDragEnd={placePin} />}
              <FollowPin value={value} />
            </Map>
            {!value && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
                <div className="bg-black/65 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Click the map or search above to pin your location
                </div>
              </div>
            )}
          </div>
        </APIProvider>
      ) : (
        <p className="text-xs text-muted-foreground">
          The map is not available here. Pick the address from the search; its location is saved with it.
        </p>
      )}

      {value && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 text-success" />
          Location pinned{MAPS_KEY ? '. Drag the marker to adjust.' : '.'}
        </p>
      )}
    </div>
  )
}
