'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  APIProvider, Map, AdvancedMarker, Pin,
  useMapsLibrary, useMap, MapMouseEvent,
} from '@vis.gl/react-google-maps'
import { Search, MapPin, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LatLng { lat: number; lng: number }

export interface LocationPickerProps {
  value: LatLng | null
  address: string
  onLocationChange: (location: LatLng) => void
  onAddressChange: (address: string) => void
  className?: string
  height?: string
  placeholder?: string
  mapId?: string
}

const DEFAULT_CENTER: LatLng = { lat: 31.5204, lng: 74.3587 } // Lahore

// ── Inner component (must be inside APIProvider) ────────────────────────────

function LocationPickerContent({
  value, address, onLocationChange, onAddressChange,
  height = '280px', placeholder = 'Search address or place…', mapId,
}: LocationPickerProps & { mapId: string }) {
  const map = useMap(mapId)
  const placesLib = useMapsLibrary('places')
  const geocodingLib = useMapsLibrary('geocoding')
  const inputRef = useRef<HTMLInputElement>(null)

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocodingLib) return
    new geocodingLib.Geocoder().geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]?.formatted_address) {
          onAddressChange(results[0].formatted_address)
        }
      }
    )
  }, [geocodingLib, onAddressChange])

  // Wire up Google Places Autocomplete
  useEffect(() => {
    if (!placesLib || !inputRef.current) return

    const ac = new placesLib.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address'],
    })

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      const lat = place.geometry?.location?.lat()
      const lng = place.geometry?.location?.lng()
      if (lat !== undefined && lng !== undefined) {
        onLocationChange({ lat, lng })
        if (place.formatted_address) onAddressChange(place.formatted_address)
        map?.panTo({ lat, lng })
        map?.setZoom(17)
      }
    })

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(google.maps.event as any).removeListener(listener)
    }
  }, [placesLib, map, onLocationChange, onAddressChange])

  // Keep input value in sync when address is set externally
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = address
    }
  }, [address])

  const handleMapClick = (e: MapMouseEvent) => {
    const latlng = e.detail.latLng
    if (!latlng) return
    onLocationChange({ lat: latlng.lat, lng: latlng.lng })
    reverseGeocode(latlng.lat, latlng.lng)
  }

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat !== undefined && lng !== undefined) {
      onLocationChange({ lat, lng })
      reverseGeocode(lat, lng)
    }
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude: lat, longitude: lng } = coords
      onLocationChange({ lat, lng })
      reverseGeocode(lat, lng)
      map?.panTo({ lat, lng })
      map?.setZoom(17)
    })
  }

  return (
    <div className="space-y-2">
      {/* Address search input */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            placeholder={placeholder}
            defaultValue={address}
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="button"
          onClick={handleLocateMe}
          title="Use my location"
          className="h-10 w-10 shrink-0 rounded-lg border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <Navigation className="h-4 w-4" />
        </button>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border shadow-sm">
        <Map
          id={mapId}
          defaultCenter={value ?? DEFAULT_CENTER}
          defaultZoom={value ? 16 : 11}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl
          onClick={handleMapClick}
          style={{ width: '100%', height }}
        >
          {value && (
            <AdvancedMarker
              position={value}
              draggable
              onDragEnd={handleMarkerDragEnd}
            >
              <Pin background="#f97316" borderColor="#ea580c" glyphColor="#fff" />
            </AdvancedMarker>
          )}
        </Map>

        {/* No pin hint */}
        {!value && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
            <div className="bg-black/65 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Click the map or search above to pin your location
            </div>
          </div>
        )}

        {/* Coordinates badge */}
        {value && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-card/90 border shadow-sm text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-muted-foreground backdrop-blur-sm">
            <MapPin className="h-3 w-3 text-primary" />
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </div>
        )}
      </div>

      {value && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 text-success" />
          Location pinned. Drag the marker to adjust.
        </p>
      )}
    </div>
  )
}

// ── Fallback (no API key) ────────────────────────────────────────────────────

function LocationPickerFallback({ address, onAddressChange, placeholder, height = '280px' }: LocationPickerProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={placeholder ?? 'Enter address manually…'}
          className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>
      <div
        className="rounded-xl border bg-muted flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        <div className="text-center space-y-1">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p>Interactive map unavailable</p>
          <p className="text-xs">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable</p>
        </div>
      </div>
    </div>
  )
}

// ── Public export ────────────────────────────────────────────────────────────

export function LocationPicker(props: LocationPickerProps) {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const internalMapId = props.mapId ?? 'gymsera-location-picker'

  if (!API_KEY) {
    return <LocationPickerFallback {...props} />
  }

  return (
    <div className={cn(props.className)}>
      <APIProvider apiKey={API_KEY}>
        <LocationPickerContent {...props} mapId={internalMapId} />
      </APIProvider>
    </div>
  )
}
