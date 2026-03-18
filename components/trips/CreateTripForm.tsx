'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { MapPin, Calendar, Upload } from 'lucide-react'
import type { TripInput, ActivityType, TripDuration } from '@/types'

const activityTypes: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'hiking', label: '徒步', emoji: '🥾' },
  { value: 'climbing', label: '登山', emoji: '🧗' },
]

const durationTypes: { value: TripDuration; label: string }[] = [
  { value: 'single', label: '单日' },
  { value: 'multi', label: '多日' },
]

interface CreateTripFormProps {
  onClose?: () => void
}

export function CreateTripForm({ onClose }: CreateTripFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [activityType, setActivityType] = useState<ActivityType>('hiking')
  const [durationType, setDurationType] = useState<TripDuration>('multi')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const tripData: TripInput = {
        name,
        activity_type: activityType,
        duration_type: durationType,
        start_date: startDate,
        end_date: durationType === 'multi' ? endDate : undefined,
        cover_photo_url: coverPhotoUrl || undefined,
        is_public: isPublic,
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create trip')
      }

      const result = await response.json()
      const tripId = result.data.id

      toast({
        title: 'Trip created!',
        description: 'Your trip has been created. Now add your daily logs.',
      })

      // Redirect to trip edit page to add daily logs
      router.push(`/trips/${tripId}/edit`)
      router.refresh()
    } catch (error) {
      console.error('Error creating trip:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create trip',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mount Fuji Summit 2026"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityType">Activity Type *</Label>
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger id="activityType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationType">Duration *</Label>
            <Select value={durationType} onValueChange={(v) => setDurationType(v as TripDuration)}>
              <SelectTrigger id="durationType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationTypes.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            {durationType === 'multi' && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required={durationType === 'multi'}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverPhoto">Cover Photo URL (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="coverPhoto"
                value={coverPhotoUrl}
                onChange={(e) => setCoverPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add a cover photo to make your trip stand out in the explore page
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isPublic">Public Trip</Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? 'Everyone can see this trip' : 'Only you can see this trip'}
              </p>
            </div>
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Trip'}
        </Button>
      </div>
    </form>
  )
}
