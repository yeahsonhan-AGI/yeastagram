'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import {
  MapPin,
  Calendar,
  Ruler,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Package,
  ChevronLeft,
  Upload,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Trip, DailyLogInput, WeatherCondition, GearCategoryInput, GearItemInput } from '@/types'

const weatherOptions: { value: WeatherCondition; label: string; emoji: string }[] = [
  { value: 'sunny', label: '晴天', emoji: '☀️' },
  { value: 'cloudy', label: '多云', emoji: '☁️' },
  { value: 'rain', label: '下雨', emoji: '🌧️' },
  { value: 'snow', label: '下雪', emoji: '❄️' },
  { value: 'wind', label: '大风', emoji: '💨' },
  { value: 'hail', label: '冰雹', emoji: '🌨️' },
]

interface EditTripClientProps {
  trip: Trip
  userId: string
}

export function EditTripClient({ trip, userId }: EditTripClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'daily-logs' | 'gear'>('overview')

  // Trip edit state
  const [tripName, setTripName] = useState(trip.name)
  const [isPublic, setIsPublic] = useState(trip.is_public)
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(trip.cover_photo_url || '')
  const [savingTrip, setSavingTrip] = useState(false)

  // Image upload state
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(trip.cover_photo_url || null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Daily logs state
  const [dailyLogs, setDailyLogs] = useState(trip.daily_logs || [])
  const [editingLog, setEditingLog] = useState<DailyLogInput | null>(null)
  const [showLogDialog, setShowLogDialog] = useState(false)

  // Gear state
  const [gearCategories, setGearCategories] = useState(trip.gear_categories || [])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newGearItem, setNewGearItem] = useState({ categoryId: '', name: '', weight_g: 0 })
  const [showAddGear, setShowAddGear] = useState(false)

  // New log form state
  const [newLog, setNewLog] = useState<DailyLogInput>({
    day_number: dailyLogs.length + 1,
    log_date: trip.start_date,
    start_location: '',
    end_location: '',
    distance_km: 0,
    elevation_gain_m: 0,
    elevation_loss_m: 0,
    min_temperature_c: 0,
    max_temperature_c: 0,
    weather_conditions: [],
    notes: '',
    photos: [],
  })

  // Calculate days for date inputs
  const getDayDates = () => {
    const dates: string[] = []
    const startDate = new Date(trip.start_date)
    const days = trip.duration_type === 'single' ? 1 :
      Math.ceil((new Date(trip.end_date!).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const dayDates = getDayDates()

  // Image upload handlers
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive',
      })
      return
    }

    setCoverPhotoFile(selectedFile)

    // Create preview
    const objectUrl = URL.createObjectURL(selectedFile)
    setCoverPhotoPreview(objectUrl)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleRemovePhoto = () => {
    setCoverPhotoFile(null)
    setCoverPhotoPreview(null)
    setCoverPhotoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadCoverPhoto = async (): Promise<string | null> => {
    if (!coverPhotoFile) return null

    setUploadingPhoto(true)

    try {
      // Upload to Supabase Storage (using posts bucket for trip covers)
      const fileExt = coverPhotoFile.name.split('.').pop()
      const fileName = `trip-covers/${userId}/${trip.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, coverPhotoFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      })
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveTrip = async () => {
    setSavingTrip(true)
    try {
      // Upload photo if a new file was selected
      let finalPhotoUrl = coverPhotoUrl
      if (coverPhotoFile) {
        const uploadedUrl = await uploadCoverPhoto()
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl
        }
      }

      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tripName,
          is_public: isPublic,
          cover_photo_url: finalPhotoUrl || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to update trip')

      toast({
        title: 'Trip updated!',
        description: 'Your trip has been updated.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update trip',
        variant: 'destructive',
      })
    } finally {
      setSavingTrip(false)
    }
  }

  const handleAddDailyLog = async () => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/daily-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      })

      if (!response.ok) throw new Error('Failed to create daily log')

      const { data } = await response.json()
      setDailyLogs([...dailyLogs, data])
      setNewLog({
        ...newLog,
        day_number: newLog.day_number + 1,
      })

      toast({
        title: 'Daily log added!',
        description: 'Your daily log has been added.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add daily log',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteDailyLog = async (logId: string) => {
    if (!confirm('Delete this daily log?')) return

    try {
      const response = await fetch(`/api/trips/${trip.id}/daily-logs/${logId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete daily log')

      setDailyLogs(dailyLogs.filter((log) => log.id !== logId))

      toast({
        title: 'Daily log deleted',
        description: 'The daily log has been removed.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete daily log',
        variant: 'destructive',
      })
    }
  }

  const handleEditDailyLog = (log: any) => {
    setEditingLog({
      day_number: log.day_number,
      log_date: log.log_date,
      start_location: log.start_location || '',
      end_location: log.end_location || '',
      distance_km: log.distance_km || 0,
      elevation_gain_m: log.elevation_gain_m || 0,
      elevation_loss_m: log.elevation_loss_m || 0,
      min_temperature_c: log.min_temperature_c || 0,
      max_temperature_c: log.max_temperature_c || 0,
      weather_conditions: log.weather_conditions || [],
      notes: log.notes || '',
      photos: log.photos || [],
    })
    setShowLogDialog(true)
  }

  const handleSaveLogEdit = async () => {
    if (!editingLog) return

    // Find the log being edited
    const logToEdit = dailyLogs.find((log) => log.day_number === editingLog.day_number)
    if (!logToEdit) return

    try {
      const response = await fetch(`/api/trips/${trip.id}/daily-logs/${logToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLog),
      })

      if (!response.ok) throw new Error('Failed to update daily log')

      const { data } = await response.json()
      setDailyLogs(dailyLogs.map((log) => log.id === logToEdit.id ? data : log))

      setShowLogDialog(false)
      setEditingLog(null)

      toast({
        title: 'Daily log updated!',
        description: 'Your daily log has been updated.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update daily log',
        variant: 'destructive',
      })
    }
  }

  const toggleWeather = (condition: WeatherCondition) => {
    setNewLog((prev) => ({
      ...prev,
      weather_conditions: prev.weather_conditions?.includes(condition)
        ? prev.weather_conditions.filter((c) => c !== condition)
        : [...(prev.weather_conditions || []), condition],
    }))
  }

  const handleAddGearCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const response = await fetch(`/api/trips/${trip.id}/gear-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      })

      if (!response.ok) throw new Error('Failed to create category')

      const { data } = await response.json()
      setGearCategories([...gearCategories, { ...data, gear_items: [] }])
      setNewCategoryName('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      })
    }
  }

  const handleAddGearItem = async () => {
    if (!newGearItem.name || newGearItem.weight_g <= 0) return

    try {
      const response = await fetch(`/api/trips/${trip.id}/gear-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGearItem),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add gear item')
      }

      const { data } = await response.json()

      // Update the categories with the new item
      const updatedCategories = gearCategories.map((cat) =>
        cat.id === newGearItem.categoryId
          ? { ...cat, gear_items: [...(cat.gear_items || []), data] }
          : cat
      )
      setGearCategories(updatedCategories)

      setNewGearItem({ categoryId: '', name: '', weight_g: 0 })
      setShowAddGear(false)

      toast({
        title: 'Success',
        description: 'Gear item added',
      })
    } catch (error) {
      console.error('Error adding gear item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add gear item',
        variant: 'destructive',
      })
    }
  }

  const calculateTotalWeight = () => {
    return gearCategories.reduce((total, cat) => {
      return total + (cat.gear_items?.reduce((sum, item) =>
        sum + (item.is_packed ? item.weight_g : 0), 0) || 0)
    }, 0)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/trips/${trip.id}`)}>
            View Trip
          </Button>
          <Button onClick={handleSaveTrip} disabled={savingTrip}>
            <Save className="h-4 w-4 mr-2" />
            {savingTrip ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('daily-logs')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'daily-logs'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          Daily Logs ({dailyLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('gear')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'gear'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          Gear
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Trip Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tripName">Trip Name</Label>
              <Input
                id="tripName"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="Trip name"
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Photo</Label>
              {/* Image Upload Area */}
              <div className="space-y-3">
                {!coverPhotoPreview ? (
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                      dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="cover-photo-upload"
                    />
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-muted">
                      <img
                        src={coverPhotoPreview}
                        alt="Cover photo preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemovePhoto}
                        disabled={savingTrip || uploadingPhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={savingTrip || uploadingPhoto}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={savingTrip || uploadingPhoto}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="cover-photo-upload"
                    />
                  </div>
                )}

                {/* Or enter URL manually */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>or enter image URL:</span>
                </div>
                <Input
                  id="coverPhotoUrl"
                  value={coverPhotoUrl}
                  onChange={(e) => {
                    setCoverPhotoUrl(e.target.value)
                    setCoverPhotoPreview(e.target.value)
                  }}
                  placeholder="https://..."
                  disabled={uploadingPhoto}
                />
              </div>
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

            {/* Trip Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <Ruler className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{trip.total_distance_km}</p>
                <p className="text-xs text-muted-foreground">km</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{trip.total_elevation_gain_m}</p>
                <p className="text-xs text-muted-foreground">m gain</p>
              </div>
              <div className="text-center">
                <Calendar className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{dailyLogs.length}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{(calculateTotalWeight() / 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">kg pack</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Logs Tab */}
      {activeTab === 'daily-logs' && (
        <div className="space-y-4">
          {/* Add New Daily Log Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Daily Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Input
                    type="number"
                    value={newLog.day_number}
                    onChange={(e) => setNewLog({ ...newLog, day_number: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Select
                    value={newLog.log_date}
                    onValueChange={(v) => setNewLog({ ...newLog, log_date: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayDates.map((date, idx) => (
                        <SelectItem key={date} value={date}>
                          Day {idx + 1}: {date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Location</Label>
                  <Input
                    value={newLog.start_location}
                    onChange={(e) => setNewLog({ ...newLog, start_location: e.target.value })}
                    placeholder="e.g., Trailhead"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Location</Label>
                  <Input
                    value={newLog.end_location}
                    onChange={(e) => setNewLog({ ...newLog, end_location: e.target.value })}
                    placeholder="e.g., Summit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newLog.distance_km || ''}
                    onChange={(e) => setNewLog({ ...newLog, distance_km: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elevation Gain (m)</Label>
                  <Input
                    type="number"
                    value={newLog.elevation_gain_m || ''}
                    onChange={(e) => setNewLog({ ...newLog, elevation_gain_m: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elevation Loss (m)</Label>
                  <Input
                    type="number"
                    value={newLog.elevation_loss_m || ''}
                    onChange={(e) => setNewLog({ ...newLog, elevation_loss_m: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Temp (°C)</Label>
                  <Input
                    type="number"
                    value={newLog.min_temperature_c || ''}
                    onChange={(e) => setNewLog({ ...newLog, min_temperature_c: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Temp (°C)</Label>
                  <Input
                    type="number"
                    value={newLog.max_temperature_c || ''}
                    onChange={(e) => setNewLog({ ...newLog, max_temperature_c: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Weather Conditions</Label>
                <div className="flex flex-wrap gap-2">
                  {weatherOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleWeather(option.value)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        newLog.weather_conditions?.includes(option.value)
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="mr-1">{option.emoji}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  placeholder="Add notes about this day..."
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <Button onClick={handleAddDailyLog} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Daily Log
              </Button>
            </CardContent>
          </Card>

          {/* Existing Daily Logs */}
          <div className="space-y-3">
            {dailyLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No daily logs yet. Add your first daily log above.
                </CardContent>
              </Card>
            ) : (
              dailyLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">Day {log.day_number}</span>
                          <span className="text-sm text-muted-foreground">{log.log_date}</span>
                          {(log.start_location || log.end_location) && (
                            <>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {log.start_location && `${log.start_location} `}
                                {log.end_location && `→ ${log.end_location}`}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          {log.distance_km && <span>{log.distance_km} km</span>}
                          {log.elevation_gain_m && <span>+{log.elevation_gain_m}m</span>}
                          {log.elevation_loss_m && <span>-{log.elevation_loss_m}m</span>}
                        </div>

                        {log.notes && (
                          <p className="text-sm mt-2 line-clamp-2">{log.notes}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDailyLog(log)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDailyLog(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Gear Tab */}
      {activeTab === 'gear' && (
        <div className="space-y-4">
          {/* Add Category */}
          <Card>
            <CardHeader>
              <CardTitle>Add Gear Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name (e.g., Shelter, Clothing)"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGearCategory()}
                />
                <Button onClick={handleAddGearCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories and Items */}
          {gearCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="text-base">{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {category.gear_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.is_packed ? '✓' : '○'} {item.weight_g}g
                    </span>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setNewGearItem({ ...newGearItem, categoryId: category.id })
                    setShowAddGear(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          ))}

          {gearCategories.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No gear categories yet. Add a category above to start building your gear list.
              </CardContent>
            </Card>
          )}

          {/* Total Weight */}
          {gearCategories.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Pack Weight:</span>
                  <span className="text-lg font-bold">
                    {(calculateTotalWeight() / 1000).toFixed(2)} kg
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Daily Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Day {editingLog?.day_number}</DialogTitle>
          </DialogHeader>
          {editingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Location</Label>
                  <Input
                    value={editingLog.start_location}
                    onChange={(e) => setEditingLog({ ...editingLog, start_location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Location</Label>
                  <Input
                    value={editingLog.end_location}
                    onChange={(e) => setEditingLog({ ...editingLog, end_location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingLog.distance_km}
                    onChange={(e) => setEditingLog({ ...editingLog, distance_km: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elevation Gain (m)</Label>
                  <Input
                    type="number"
                    value={editingLog.elevation_gain_m}
                    onChange={(e) => setEditingLog({ ...editingLog, elevation_gain_m: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elevation Loss (m)</Label>
                  <Input
                    type="number"
                    value={editingLog.elevation_loss_m}
                    onChange={(e) => setEditingLog({ ...editingLog, elevation_loss_m: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Temp (°C)</Label>
                  <Input
                    type="number"
                    value={editingLog.min_temperature_c}
                    onChange={(e) => setEditingLog({ ...editingLog, min_temperature_c: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Temp (°C)</Label>
                  <Input
                    type="number"
                    value={editingLog.max_temperature_c}
                    onChange={(e) => setEditingLog({ ...editingLog, max_temperature_c: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingLog.notes}
                  onChange={(e) => setEditingLog({ ...editingLog, notes: e.target.value })}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLogDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveLogEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Gear Item Dialog */}
      <Dialog open={showAddGear} onOpenChange={setShowAddGear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gear Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={newGearItem.name}
                onChange={(e) => setNewGearItem({ ...newGearItem, name: e.target.value })}
                placeholder="e.g., Sleeping Bag"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (grams)</Label>
              <Input
                type="number"
                value={newGearItem.weight_g}
                onChange={(e) => setNewGearItem({ ...newGearItem, weight_g: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 850"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddGear(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGearItem}>
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
