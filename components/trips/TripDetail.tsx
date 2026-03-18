'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  MapPin,
  Calendar,
  Ruler,
  TrendingUp,
  TrendingDown,
  Mountain,
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  Send,
  Lock,
  Globe,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Trip, DailyLog, WeatherCondition } from '@/types'

const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  snow: '❄️',
  wind: '💨',
  hail: '🌨️',
}

interface TripDetailProps {
  trip: Trip
  currentUserId: string
}

export function TripDetail({ trip, currentUserId }: TripDetailProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(trip.is_liked || false)
  const [likesCount, setLikesCount] = useState(trip.likes_count || 0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)
  const [loadingLike, setLoadingLike] = useState(false)

  // Current daily log being viewed (for multi-day trips)
  const [currentLogIndex, setCurrentLogIndex] = useState(0)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/trips/${trip.id}/comments`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    }
    fetchComments()
  }, [trip.id])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleLike = async () => {
    setLoadingLike(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}/like`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      setIsLiked(!isLiked)
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      })
    } finally {
      setLoadingLike(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return

    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete trip')

      toast({
        title: 'Trip deleted',
        description: 'Your trip has been deleted.',
      })

      router.push('/trips')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete trip',
        variant: 'destructive',
      })
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link copied!',
        description: 'Trip URL copied to clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoadingComment(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      const data = await response.json()
      setComments((prev) => [...prev, data.comment])
      setNewComment('')

      toast({
        title: 'Comment posted!',
        description: 'Your comment has been added.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      })
    } finally {
      setLoadingComment(false)
    }
  }

  const getActivityEmoji = () => {
    return trip.activity_type === 'hiking' ? '🥾' : '🧗'
  }

  const getActivityLabel = () => {
    return trip.activity_type === 'hiking' ? '徒步' : '登山'
  }

  const calculatePackWeight = () => {
    if (!trip.gear_categories || trip.gear_categories.length === 0) return 0
    return trip.gear_categories.reduce((total, category) => {
      return total + (category.gear_items?.reduce((sum, item) => {
        return sum + (item.is_packed ? item.weight_g : 0)
      }, 0) || 0)
    }, 0)
  }

  const packWeight = calculatePackWeight()
  const isOwner = currentUserId === trip.user_id
  const dailyLogs = trip.daily_logs || []
  const currentLog = dailyLogs[currentLogIndex]

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-4xl">{getActivityEmoji()}</span>
          <div>
            <h1 className="text-2xl font-bold">{trip.name}</h1>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <span>{getActivityLabel()}</span>
              {trip.is_public ? (
                <Globe className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/trips/${trip.id}/edit`)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="flex items-center space-x-3 p-4 border rounded-lg">
        <Avatar className="h-10 w-10">
          <AvatarImage src={trip.profiles?.avatar_url || undefined} />
          <AvatarFallback>
            {trip.profiles?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{trip.profiles?.username || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground">
            Created {formatDate(trip.created_at)}
          </p>
        </div>
      </div>

      {/* Cover Photo */}
      {(trip.cover_photo_url || dailyLogs[0]?.photos?.[0]) && (
        <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
          <img
            src={trip.cover_photo_url || dailyLogs[0]?.photos?.[0]}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Date Range */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {trip.duration_type === 'single' ? (
                  formatDate(trip.start_date)
                ) : (
                  `${formatDate(trip.start_date)} - ${formatDate(trip.end_date!)}`
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Stats */}
      {(trip.total_distance_km > 0 || trip.total_elevation_gain_m > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Trip Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trip.total_distance_km > 0 && (
                <div className="text-center">
                  <Ruler className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">
                    {trip.total_distance_km >= 10 ? trip.total_distance_km.toFixed(1) : (trip.total_distance_km * 1000).toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trip.total_distance_km >= 10 ? 'km' : 'm'}
                  </p>
                </div>
              )}
              {trip.total_elevation_gain_m > 0 && (
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{trip.total_elevation_gain_m}</p>
                  <p className="text-sm text-muted-foreground">m gain</p>
                </div>
              )}
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{dailyLogs.length}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>
              {packWeight > 0 && (
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{(packWeight / 1000).toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">kg pack</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Logs */}
      {dailyLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Daily Logs</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-muted-foreground">
                  Day {currentLogIndex + 1} of {dailyLogs.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentLogIndex(Math.max(0, currentLogIndex - 1))}
                  disabled={currentLogIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentLogIndex(Math.min(dailyLogs.length - 1, currentLogIndex + 1))}
                  disabled={currentLogIndex === dailyLogs.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentLog && (
              <>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">Day {currentLog.day_number}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(currentLog.log_date)}</p>
                  </div>
                  {(currentLog.start_location || currentLog.end_location) && (
                    <div className="text-right text-sm">
                      {currentLog.start_location && (
                        <p className="text-muted-foreground">From: {currentLog.start_location}</p>
                      )}
                      {currentLog.end_location && (
                        <p className="text-muted-foreground">To: {currentLog.end_location}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {currentLog.distance_km && (
                    <div className="text-center">
                      <Ruler className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="font-medium">{currentLog.distance_km} km</p>
                    </div>
                  )}
                  {currentLog.elevation_gain_m && (
                    <div className="text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="font-medium">{currentLog.elevation_gain_m}m</p>
                    </div>
                  )}
                  {currentLog.elevation_loss_m && (
                    <div className="text-center">
                      <TrendingDown className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="font-medium">{currentLog.elevation_loss_m}m</p>
                    </div>
                  )}
                  {currentLog.weather_conditions && currentLog.weather_conditions.length > 0 && (
                    <div className="text-center">
                      <div className="flex justify-center gap-1">
                        {currentLog.weather_conditions.slice(0, 3).map((w) => (
                          <span key={w} className="text-xl" title={w}>
                            {weatherIcons[w] || '🌤️'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {currentLog.photos && currentLog.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {currentLog.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo}
                          alt={`Day ${currentLog.day_number} photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {currentLog.notes && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{currentLog.notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gear List */}
      {trip.gear_categories && trip.gear_categories.length > 0 && packWeight > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Gear List
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                Total: {(packWeight / 1000).toFixed(2)} kg
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trip.gear_categories.map((category) => (
                <div key={category.id}>
                  <h4 className="font-medium mb-2">{category.name}</h4>
                  <div className="space-y-1">
                    {category.gear_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.is_packed ? '✓' : '○'} {item.weight_g}g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-8">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLike}
              disabled={loadingLike}
              className="flex items-center space-x-2"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
              <span>{trip.comments_count || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Comments</h2>

        {!trip.is_public && (
          <p className="text-muted-foreground">Comments are only available for public trips.</p>
        )}

        {trip.is_public && (
          <>
            {/* Comment form */}
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loadingComment || !newComment.trim()}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {/* Comments list */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 p-4 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{comment.profiles?.username || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
