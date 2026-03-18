'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { LeafletMap } from '@/components/maps/LeafletMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { subscribeToGroupLocations, unsubscribeFromGroupLocations, type GroupLocationCallback } from '@/lib/realtime/group-location'
import type { GroupMember } from '@/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface GroupLocationMapProps {
  groupId: string
  members: GroupMember[]
  currentUserId?: string
}

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never updated'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minutes ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days ago`
}

export function GroupLocationMap({ groupId, members, currentUserId }: GroupLocationMapProps) {
  console.log('GroupLocationMap rendered with:', {
    groupId,
    membersCount: members.length,
    members: members.map(m => ({
      id: m.id,
      userId: m.user_id,
      username: m.user?.username,
      locationSharingEnabled: m.location_sharing_enabled,
      hasLocation: !!(m.last_location_lat && m.last_location_lng),
    })),
    currentUserId,
  })

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [map, setMap] = useState<L.Map | null>(null)
  const [markers, setMarkers] = useState<L.Marker[]>([])
  const [localMembers, setLocalMembers] = useState<GroupMember[]>(members)
  const watchIdRef = useRef<number | null>(null)

  // Stable callback for map load
  const handleMapLoad = useCallback((loadedMap: L.Map) => {
    setMap(loadedMap)
  }, [])

  // Get current member's location sharing status
  const currentMember = localMembers.find(m => m.user_id === currentUserId)

  // Update local members when props change
  useEffect(() => {
    setLocalMembers(members)
  }, [members])

  // Check initial location sharing status
  useEffect(() => {
    if (currentMember) {
      setIsSharingLocation(currentMember.location_sharing_enabled || false)
    }
  }, [currentMember])

  // Subscribe to real-time location updates
  useEffect(() => {
    const handleLocationUpdate: GroupLocationCallback = (payload) => {
      console.log('Location update received:', payload)
      const updatedMember = payload.new as GroupMember

      setLocalMembers(prev =>
        prev.map(member =>
          member.id === updatedMember.id ? { ...member, ...updatedMember } : member
        )
      )
    }

    const channel = subscribeToGroupLocations(groupId, handleLocationUpdate)

    return () => {
      unsubscribeFromGroupLocations(channel)
    }
  }, [groupId])

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    console.log('getCurrentLocation called, navigator.geolocation:', !!navigator.geolocation)
    if (!navigator.geolocation) {
      alert('Your browser does not support location services')
      return
    }

    setIsUpdatingLocation(true)

    console.log('Requesting location permission...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(location)

        console.log('Location obtained:', location)

        // Update server
        updateLocationOnServer(location)

        // Pan to user location on map (if map is loaded)
        if (map) {
          map.panTo([location.lat, location.lng])
          map.setZoom(15)
        }

        setIsUpdatingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied, please allow location access in browser settings'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Unable to get location information'
            break
          case error.TIMEOUT:
            errorMessage = 'Location timeout'
            break
        }
        alert(errorMessage)
        setIsUpdatingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, []) // Remove map dependency

  // Start watching location (continuous updates)
  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation) return

    // Stop existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(location)
        updateLocationOnServer(location)
      },
      (error) => {
        console.error('Error watching location:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  // Stop watching location
  const stopWatchingLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // Update location on server
  const updateLocationOnServer = async (location: { lat: number; lng: number }) => {
    try {
      console.log('Updating location on server:', location, 'currentUserId:', currentUserId)
      const response = await fetch(`/api/groups/${groupId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
        }),
      })

      console.log('Location update response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Location update successful:', data)

        // Update local state immediately to show the marker
        setLocalMembers(prev =>
          prev.map(member =>
            member.user_id === currentUserId
              ? {
                  ...member,
                  last_location_lat: location.lat,
                  last_location_lng: location.lng,
                  last_location_updated: new Date().toISOString(),
                }
              : member
          )
        )
      } else {
        const errorData = await response.json()
        console.error('Location update failed:', errorData)
      }
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  // Toggle location sharing
  const toggleLocationSharing = async () => {
    try {
      const newEnabled = !isSharingLocation
      const response = await fetch(`/api/groups/${groupId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to toggle location sharing')
      }

      setIsSharingLocation(newEnabled)

      // Update local state immediately
      setLocalMembers(prev =>
        prev.map(member =>
          member.user_id === currentUserId
            ? { ...member, location_sharing_enabled: newEnabled }
            : member
        )
      )

      if (newEnabled) {
        // Start sharing: get initial location and start watching
        getCurrentLocation()
        startWatchingLocation()
      } else {
        // Stop sharing: stop watching location
        stopWatchingLocation()
        // Clear local location data
        setLocalMembers(prev =>
          prev.map(member =>
            member.user_id === currentUserId
              ? { ...member, location_sharing_enabled: false, last_location_lat: null, last_location_lng: null, last_location_updated: null }
              : member
          )
        )
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to toggle location sharing')
    }
  }

  // Create custom icon for member
  const createMemberIcon = (member: GroupMember, isCurrentUser: boolean): L.DivIcon => {
    const avatarUrl = member.user?.avatar_url || ''
    const initial = (member.user?.username || member.user?.full_name || 'U')[0]
    const borderColor = isCurrentUser ? '#3b82f6' : '#ffffff'
    const bgColor = isCurrentUser ? '#3b82f6' : '#6366f1'

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid ${borderColor};
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
            background: ${bgColor};
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${avatarUrl ? `
              <img src="${avatarUrl}"
                   style="width: 100%; height: 100%; object-fit: cover;"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                ${initial}
              </div>
            ` : `
              <div style="color: white; font-weight: 600; font-size: 14px;">
                ${initial}
              </div>
            `}
          </div>
          ${isCurrentUser ? `
            <div style="
              position: absolute;
              bottom: -4px;
              right: -4px;
              width: 16px;
              height: 16px;
              background: #3b82f6;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            "></div>
          ` : `
            <div style="
              position: absolute;
              bottom: -4px;
              right: -4px;
              width: 12px;
              height: 12px;
              background: #22c55e;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              animation: pulse 2s infinite;
            "></div>
          `}
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    })
  }

  // Update markers when members change
  useEffect(() => {
    if (!map) return

    console.log('Updating markers...', {
      mapLoaded: !!map,
      localMembersCount: localMembers.length,
      currentUserId,
      localMembers: localMembers.map(m => ({
        userId: m.user_id,
        locationSharingEnabled: m.location_sharing_enabled,
        hasLocation: !!(m.last_location_lat && m.last_location_lng),
        lat: m.last_location_lat,
        lng: m.last_location_lng,
      }))
    })

    // Clear existing markers
    markers.forEach(m => {
      try {
        m.remove()
      } catch (e) {
        // Marker might already be removed
      }
    })

    // Add markers for each member with location
    const membersWithLocation = localMembers.filter(
      m => m.location_sharing_enabled && m.last_location_lat && m.last_location_lng
    )

    console.log('Members with location:', membersWithLocation.length)

    if (membersWithLocation.length === 0) {
      setMarkers([])
      return
    }

    const newMarkers: L.Marker[] = []

    membersWithLocation.forEach(member => {
      const isCurrentUser = member.user_id === currentUserId
      const icon = createMemberIcon(member, isCurrentUser)

      const marker = L.marker(
        [member.last_location_lat!, member.last_location_lng!],
        { icon }
      )

      // Add popup
      const popupContent = `
        <div style="padding: 12px; min-width: 150px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">
            ${member.user?.username || member.user?.full_name || 'User'}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            ${formatRelativeTime(member.last_location_updated)}
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      marker.addTo(map)
      newMarkers.push(marker)
    })

    setMarkers(newMarkers)

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const group = new L.FeatureGroup(newMarkers)
      map.fitBounds(group.getBounds().pad(0.1))
    }

    console.log('Markers added:', newMarkers.length)
  }, [map, localMembers, currentUserId])

  // Cleanup location watching on unmount
  useEffect(() => {
    return () => {
      stopWatchingLocation()
    }
  }, [stopWatchingLocation])

  const sharingMembers = localMembers.filter(m => m.location_sharing_enabled)
  const membersWithLocation = sharingMembers.filter(m => m.last_location_lat && m.last_location_lng)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Location Sharing
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={isSharingLocation ? 'default' : 'outline'}
              size="sm"
              onClick={toggleLocationSharing}
            >
              {isSharingLocation ? (
                <>
                  <MapPin className="w-4 h-4 mr-1" />
                  Location Shared
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-1" />
                  Enable Location Sharing
                </>
              )}
            </Button>
            {isSharingLocation && (
              <Button variant="outline" size="sm" onClick={getCurrentLocation} disabled={isUpdatingLocation}>
                {isUpdatingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Updating
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-1" />
                    Update Location
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map */}
          <div className="h-80 rounded-lg overflow-hidden border">
            <LeafletMap
              initialCenter={membersWithLocation.length > 0
                ? [membersWithLocation[0].last_location_lat!, membersWithLocation[0].last_location_lng!]
                : [27.7172, 85.324]
              }
              initialZoom={membersWithLocation.length > 0 ? 13 : 5}
              onMapLoad={handleMapLoad}
              style={{ height: '100%' }}
            />
          </div>

          {/* Members list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Members sharing location ({sharingMembers.length})
              </h4>
              {sharingMembers.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {membersWithLocation.length} members have updated their location
                </span>
              )}
            </div>

            {sharingMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sharingMembers.map((member) => {
                  const hasLocation = !!member.last_location_lat && !!member.last_location_lng
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-2 p-2 border rounded-lg transition-colors ${
                        !hasLocation ? 'bg-muted/50' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(member.user?.username || member.user?.full_name || 'U')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate flex items-center gap-2">
                          <span>{member.user?.username || member.user?.full_name || 'User'}</span>
                          {member.user_id === currentUserId && (
                            <Badge variant="default" className="ml-0 text-xs">Me</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {hasLocation ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                              {formatRelativeTime(member.last_location_updated)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                              Waiting for location update...
                            </span>
                          )}
                        </div>
                      </div>
                      {hasLocation && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (map) {
                              map.panTo([member.last_location_lat!, member.last_location_lng!])
                              map.setZoom(15)
                            }
                          }}
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No members sharing location</p>
                <p className="text-sm mt-1">After enabling location sharing, you can see other members' real-time locations</p>
              </div>
            )}
          </div>

          {/* Privacy note */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <strong>Privacy Notice:</strong>
            Location information is only visible to team members. You can disable location sharing at any time. Location data will not be stored or used for other purposes.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
