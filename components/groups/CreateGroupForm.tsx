'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import type { GroupInput } from '@/types'

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(200, 'Group name must be at most 200 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  activity_type: z.enum(['hiking', 'climbing']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  cover_photo_url: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  is_public: z.boolean(),
  join_type: z.enum(['open', 'request', 'invite_only']),
  max_members: z.number().min(2, 'At least 2 members').max(50, 'At most 50 members'),
  trip_id: z.string().optional(),
})

interface CreateGroupFormProps {
  tripId?: string
  onSuccess?: () => void
}

export function CreateGroupForm({ tripId, onSuccess }: CreateGroupFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      activity_type: 'hiking',
      start_date: '',
      end_date: '',
      cover_photo_url: '',
      is_public: false,
      join_type: 'request',
      max_members: 10,
      trip_id: tripId,
    },
  })

  const onSubmit = async (values: z.infer<typeof createGroupSchema>) => {
    setIsSubmitting(true)
    try {
      const groupData: GroupInput = {
        name: values.name,
        description: values.description,
        activity_type: values.activity_type,
        start_date: values.start_date,
        end_date: values.end_date || undefined,
        cover_photo_url: values.cover_photo_url || undefined,
        is_public: values.is_public,
        join_type: values.join_type,
        max_members: values.max_members,
        trip_id: values.trip_id,
      }

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create group')
      }

      const data = await response.json()
      toast.success('Group created successfully!')
      onSuccess?.()
      router.push(`/groups/${data.group.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create group')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Group</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Give your group a name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your group..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hiking">Hiking</SelectItem>
                        <SelectItem value="climbing">Mountain Climbing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_members"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Members</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={50}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="join_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Join Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select join type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open - Anyone can join directly</SelectItem>
                      <SelectItem value="request">Request - Requires leader approval</SelectItem>
                      <SelectItem value="invite_only">Invite Only - Can only join via invitation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Public Group
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Public groups are visible to everyone, private groups are only visible to members
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cover_photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
