'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  className?: string
  initialSearch?: string
  initialCity?: string
}

export function SearchBar({ className, initialSearch = '', initialCity = '' }: SearchBarProps) {
  const [search, setSearch] = useState(initialSearch)
  const [city, setCity] = useState(initialCity)
  const router = useRouter()

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (city.trim()) params.set('city', city.trim())
    router.push(`/gyms?${params.toString()}`)
  }

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-xl shadow-black/10">
        <div className="flex items-center gap-2 flex-1 px-3">
          <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="City..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          />
        </div>
        <div className="h-px sm:h-auto sm:w-px bg-border" />
        <div className="flex items-center gap-2 flex-1 px-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search gym name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          />
        </div>
        <Button size="lg" onClick={handleSearch} className="shrink-0 rounded-xl">
          <Search className="h-4 w-4 mr-2" />
          Search Gyms
        </Button>
      </div>
    </div>
  )
}
