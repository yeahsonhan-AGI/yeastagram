'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LeafletMapProps {
  initialCenter?: [number, number] // [lat, lng]
  initialZoom?: number
  className?: string
  style?: React.CSSProperties
  onMapLoad?: (map: L.Map) => void
  children?: React.ReactNode
}

/**
 * OpenStreetMap 地图组件 (使用 Leaflet)
 *
 * 完全免费，覆盖全球，无需任何 API Key
 * 适合在尼泊尔等海外地区使用
 */
export function LeafletMap({
  initialCenter = [27.7172, 85.324], // 尼泊尔加德满都
  initialZoom = 13,
  className = '',
  style,
  onMapLoad,
  children,
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitializedRef = useRef(false)

  // Stable callback reference
  const handleMapLoad = useCallback((map: L.Map) => {
    onMapLoad?.(map)
  }, [onMapLoad])

  useEffect(() => {
    if (!mapContainer.current || isInitializedRef.current) return

    isInitializedRef.current = true

    try {
      // Initialize the map
      const map = L.map(mapContainer.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
      })

      // Add OpenStreetMap tiles (free, no API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setIsLoading(false)
      handleMapLoad(map)
    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err)
      setError('地图加载失败')
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      isInitializedRef.current = false
    }
  }, []) // Empty deps - run only once

  // Update map center/zoom when props change
  useEffect(() => {
    if (mapRef.current && initialCenter && initialZoom !== undefined) {
      mapRef.current.setView(initialCenter, initialZoom)
    }
  }, [initialCenter, initialZoom])

  return (
    <div className={`relative ${className}`} style={style}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" style={{ minHeight: '300px' }} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm text-muted-foreground">加载地图...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
          <div className="text-center p-4 bg-background rounded-lg shadow">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
