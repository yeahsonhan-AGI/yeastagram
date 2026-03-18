'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MapPin, Mountain, Droplets, Package, Calendar } from 'lucide-react'
import type { GroupItineraryDay } from '@/types'

interface ItineraryDayFormProps {
  day?: GroupItineraryDay
  dayNumber: number
  itineraryId: string
  onSave: (dayData: any) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

const WEATHER_OPTIONS = [
  'Sunny', 'Cloudy', 'Overcast', 'Light Rain', 'Moderate Rain', 'Heavy Rain', 'Thunderstorm',
  'Light Snow', 'Moderate Snow', 'Heavy Snow', 'Fog', 'Haze', 'Windy', 'Hot', 'Cold'
]

export function ItineraryDayForm({ day, dayNumber, itineraryId, onSave, onCancel, isOpen }: ItineraryDayFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    log_date: day?.log_date || '',
    start_location: day?.start_location || '',
    end_location: day?.end_location || '',
    distance_km: day?.distance_km || '',
    elevation_gain_m: day?.elevation_gain_m || '',
    elevation_loss_m: day?.elevation_loss_m || '',
    weather_conditions: day?.weather_conditions || [],
    gear_suggestions: day?.gear_suggestions || '',
    notes: day?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave({
        itineraryId,
        day_number: dayNumber,
        ...formData,
        distance_km: formData.distance_km ? parseFloat(String(formData.distance_km)) : null,
        elevation_gain_m: formData.elevation_gain_m ? parseInt(String(formData.elevation_gain_m)) : null,
        elevation_loss_m: formData.elevation_loss_m ? parseInt(String(formData.elevation_loss_m)) : null,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleWeather = (weather: string) => {
    setFormData(prev => ({
      ...prev,
      weather_conditions: prev.weather_conditions?.includes(weather)
        ? prev.weather_conditions.filter(w => w !== weather)
        : [...(prev.weather_conditions || []), weather]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Day {dayNumber} Itinerary
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="log_date">Date *</Label>
            <Input
              id="log_date"
              type="date"
              value={formData.log_date}
              onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
              required
            />
          </div>

          {/* Start/End Points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_location" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Start Point
              </Label>
              <Input
                id="start_location"
                placeholder="e.g., Base Camp"
                value={formData.start_location}
                onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_location" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                End Point
              </Label>
              <Input
                id="end_location"
                placeholder="e.g., Camp"
                value={formData.end_location}
                onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
              />
            </div>
          </div>

          {/* Distance and Elevation */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="distance_km" className="flex items-center gap-1">
                <Mountain className="w-4 h-4" />
                Distance (km)
              </Label>
              <Input
                id="distance_km"
                type="number"
                step="0.1"
                placeholder="0.0"
                value={formData.distance_km}
                onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="elevation_gain_m">Elevation Gain (m)</Label>
              <Input
                id="elevation_gain_m"
                type="number"
                placeholder="0"
                value={formData.elevation_gain_m}
                onChange={(e) => setFormData({ ...formData, elevation_gain_m: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="elevation_loss_m">Elevation Loss (m)</Label>
              <Input
                id="elevation_loss_m"
                type="number"
                placeholder="0"
                value={formData.elevation_loss_m}
                onChange={(e) => setFormData({ ...formData, elevation_loss_m: e.target.value })}
              />
            </div>
          </div>

          {/* Weather Conditions */}
          <div>
            <Label className="flex items-center gap-1 mb-2">
              <Droplets className="w-4 h-4" />
              Expected Weather
            </Label>
            <div className="flex flex-wrap gap-2">
              {WEATHER_OPTIONS.map((weather) => (
                <button
                  key={weather}
                  type="button"
                  onClick={() => toggleWeather(weather)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    formData.weather_conditions?.includes(weather)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {weather}
                </button>
              ))}
            </div>
          </div>

          {/* Gear Suggestions */}
          <div>
            <Label htmlFor="gear_suggestions" className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              Gear Suggestions
            </Label>
            <Textarea
              id="gear_suggestions"
              placeholder="e.g., Waterproof jacket, trekking poles, headlamp, first aid kit..."
              rows={2}
              value={formData.gear_suggestions}
              onChange={(e) => setFormData({ ...formData, gear_suggestions: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add other important information, e.g., water sources, dangerous sections, meeting time..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : day ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
