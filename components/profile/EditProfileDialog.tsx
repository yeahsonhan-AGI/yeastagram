'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Camera } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Profile } from '@/types'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
}

export function EditProfileDialog({ open, onOpenChange, profile }: EditProfileDialogProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(profile.username || '')
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setUsername(profile.username || '')
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setWebsite(profile.website || '')
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [open, profile])

  const handleAvatarChange = (file: File | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      })
      return
    }

    setAvatarFile(file)
    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let avatarUrl = profile.avatar_url

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('Avatars')
          .upload(fileName, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('Avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          full_name: fullName || null,
          bio: bio || null,
          website: website || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      })

      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center space-x-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                {(avatarPreview || profile.avatar_url) ? (
                  <img
                    src={avatarPreview || profile.avatar_url || undefined}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#FAF8F5] text-2xl font-semibold">
                    {profile.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold">{profile.username}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                pattern="[a-zA-Z0-9_]{3,30}"
                title="3-30 characters, letters, numbers, and underscores only"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={150}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/150
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
