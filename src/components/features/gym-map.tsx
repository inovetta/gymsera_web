'use client'

import { useEffect } from 'react'
import { APIProvider, Map, Marker, useApiLoadingStatus } from '@vis.gl/react-google-maps'

interface GymMapProps {
  latitude: number
  longitude: number
  title?: string
  className?: string
  /** Called once when the map cannot be shown (no key, the script failed, or Google refused the key). */
  onUnavailable?: () => void
}

// The web key (Maps JavaScript API only) draws the map; no place search runs in the browser (NEW-140).
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

// APILoadingStatus.FAILED / AUTH_FAILURE (the library's string values).
const UNAVAILABLE: ReadonlyArray<string> = ['FAILED', 'AUTH_FAILURE']

/**
 * Phase 7 P9c (C): the branch page showed Google's "This page can't load Google Maps correctly".
 * Cause (checked on gymsera.com, 2026-11-05): an Advanced Marker on a map with no Map ID; the key
 * itself loads. A classic Marker needs no Map ID. If the map still cannot load (key refused,
 * script blocked), nothing is drawn and the page is told, so it hides the map instead of showing
 * Google's error box.
 */
export function GymMap({ latitude, longitude, title, className, onUnavailable }: GymMapProps) {
  useEffect(() => {
    if (!API_KEY) onUnavailable?.()
  }, [onUnavailable])

  // NEW-140: on its own it says so (no setting name); a page that passes onUnavailable hides it.
  if (!API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-xl text-sm text-muted-foreground ${className ?? 'h-64'}`}>
        The map is not available here.
      </div>
    )
  }

  return (
    <APIProvider apiKey={API_KEY} onError={() => onUnavailable?.()}>
      <GymMapCanvas latitude={latitude} longitude={longitude} title={title} className={className} onUnavailable={onUnavailable} />
    </APIProvider>
  )
}

function GymMapCanvas({ latitude, longitude, title, className, onUnavailable }: GymMapProps) {
  const status = useApiLoadingStatus()
  const failed = UNAVAILABLE.includes(status)

  useEffect(() => {
    if (failed) onUnavailable?.()
  }, [failed, onUnavailable])

  if (failed) return null

  const position = { lat: latitude, lng: longitude }
  return (
    <div className={`overflow-hidden rounded-xl border ${className ?? 'h-64'}`}>
      <Map
        defaultCenter={position}
        defaultZoom={15}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl
        style={{ width: '100%', height: '100%' }}
      >
        <Marker position={position} title={title} />
      </Map>
    </div>
  )
}
