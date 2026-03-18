'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit2, Trash2, MapPin, Mountain, Calendar as CalendarIcon, Droplets, Package, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { GroupSharedItinerary, GroupItineraryDay } from '@/types'
import { ItineraryDayForm } from './ItineraryDayForm'

interface GroupItineraryProps {
  groupId: string
  isLeader: boolean
  initialItinerary?: GroupSharedItinerary | null
}

export function GroupItinerary({ groupId, isLeader, initialItinerary }: GroupItineraryProps) {
  const [itinerary, setItinerary] = useState<GroupSharedItinerary | null>(initialItinerary || null)
  const [days, setDays] = useState<GroupItineraryDay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<GroupItineraryDay | undefined>()

  useEffect(() => {
    if (initialItinerary) {
      setItinerary(initialItinerary)
      setDays(initialItinerary.days || [])
    }
  }, [initialItinerary])

  const handleCreateItinerary = async () => {
    const name = prompt('Enter itinerary name (e.g., ACT Hiking Plan):')
    if (!name) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create')
      }

      const data = await response.json()
      setItinerary(data.itinerary)
      // Clear existing days and load from the returned itinerary
      setDays(data.itinerary.days || [])
      toast.success('Itinerary created successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDay = async (dayData: any) => {
    setIsLoading(true)
    try {
      const url = editingDay
        ? `/api/groups/${groupId}/itinerary/days`
        : `/api/groups/${groupId}/itinerary/days`

      const method = editingDay ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDay ? { ...dayData, dayId: editingDay.id } : dayData),
      })

      if (!response.ok) {
        const data = await response.json()
        // Check for duplicate key error
        if (data.details?.includes('duplicate key') || data.message?.includes('unique constraint')) {
          throw new Error('Day ' + dayData.day_number + ' already exists. Please edit the existing day or add a new day')
        }
        throw new Error(data.error || 'Failed to save')
      }

      const data = await response.json()

      if (editingDay) {
        setDays(days.map(d => d.id === editingDay.id ? data.day : d))
        toast.success('Itinerary updated')
      } else {
        setDays([...days, data.day])
        toast.success('Day ' + dayData.day_number + ' added')
      }

      setIsFormOpen(false)
      setEditingDay(undefined)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Are you sure you want to delete this day?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/itinerary/days?dayId=${dayId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      setDays(days.filter(d => d.id !== dayId))
      toast.success('Deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setIsLoading(false)
    }
  }

  const openAddForm = () => {
    setEditingDay(undefined)
    setIsFormOpen(true)
  }

  const openEditForm = (day: GroupItineraryDay) => {
    setEditingDay(day)
    setIsFormOpen(true)
  }

  // 统计信息
  const totalDistance = days.reduce((sum, day) => sum + (day.distance_km || 0), 0)
  const totalElevationGain = days.reduce((sum, day) => sum + (day.elevation_gain_m || 0), 0)
  const totalElevationLoss = days.reduce((sum, day) => sum + (day.elevation_loss_m || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Shared Itinerary</CardTitle>
            {itinerary && (
              <p className="text-sm text-muted-foreground mt-1">{itinerary.name}</p>
            )}
          </div>
          {isLeader && (
            <div className="flex gap-2">
              {!itinerary ? (
                <Button size="sm" onClick={handleCreateItinerary} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create Itinerary
                </Button>
              ) : (
                <Button size="sm" onClick={openAddForm} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Day
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Statistics */}
        {days.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <span>{days.length} days</span>
            </div>
            {totalDistance > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mountain className="w-4 h-4" />
                <span>{totalDistance.toFixed(1)} km</span>
              </div>
            )}
            {totalElevationGain > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>↑ {totalElevationGain}m</span>
              </div>
            )}
            {totalElevationLoss > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>↓ {totalElevationLoss}m</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!itinerary ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No shared itinerary created yet</p>
            {isLeader && (
              <p className="text-sm text-muted-foreground mt-2">Click "Create Itinerary" to start planning the group activity</p>
            )}
          </div>
        ) : days.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No itinerary days added yet</p>
            {isLeader && (
              <Button size="sm" onClick={openAddForm}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Day
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day, index) => (
              <div key={day.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm font-bold text-green-600">
                        {day.day_number}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {new Date(day.log_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </div>
                        {(day.start_location || day.end_location) && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {day.start_location || 'Start'} → {day.end_location || 'End'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isLeader && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(day)}
                          disabled={isLoading}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDay(day.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  {/* Distance and Elevation */}
                  {(day.distance_km || day.elevation_gain_m || day.elevation_loss_m) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {day.distance_km && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          <Mountain className="w-3 h-3" />
                          <span>{day.distance_km} km</span>
                        </div>
                      )}
                      {day.elevation_gain_m && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded">
                          <span>↑ {day.elevation_gain_m}m</span>
                        </div>
                      )}
                      {day.elevation_loss_m && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded">
                          <span>↓ {day.elevation_loss_m}m</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weather */}
                  {day.weather_conditions && day.weather_conditions.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <div className="flex flex-wrap gap-1">
                        {day.weather_conditions.map((w, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gear Suggestions */}
                  {day.gear_suggestions && (
                    <div className="flex items-start gap-2 text-sm">
                      <Package className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Gear Suggestions:</span>
                        <span className="text-muted-foreground">{day.gear_suggestions}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {day.notes && (
                    <div className="text-sm bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                      <span className="text-muted-foreground whitespace-pre-wrap">{day.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Itinerary Day Form */}
        {itinerary && (
          <ItineraryDayForm
            isOpen={isFormOpen}
            day={editingDay}
            dayNumber={editingDay ? editingDay.day_number : days.length + 1}
            itineraryId={itinerary.id}
            onSave={handleSaveDay}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingDay(undefined)
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
