'use client'

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

interface GymMapProps {
  latitude: number
  longitude: number
  title?: string
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

export function GymMap({ latitude, longitude, title, className }: GymMapProps) {
  if (!API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-xl text-sm text-muted-foreground ${className ?? 'h-64'}`}>
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    )
  }

  const position = { lat: latitude, lng: longitude }

  return (
    <APIProvider apiKey={API_KEY}>
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
          <AdvancedMarker position={position} title={title}>
            <Pin background="#f97316" borderColor="#ea580c" glyphColor="#fff" />
          </AdvancedMarker>
        </Map>
      </div>
    </APIProvider>
  )
}
