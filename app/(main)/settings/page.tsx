import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getProfile } from '@/lib/db/queries'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const profile = await getProfile(user.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Username</p>
              <p className="text-sm text-muted-foreground">@{profile?.username || 'user'}</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Change
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Full Name</p>
              <p className="text-sm text-muted-foreground">{profile?.full_name || 'Not set'}</p>
            </div>
            <a href={`/${profile?.username || 'profile'}`}>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </a>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>
            Your account statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Followers</p>
              <p className="text-sm text-muted-foreground">People following you</p>
            </div>
            <p className="font-semibold">{profile?.followers_count || 0}</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Following</p>
              <p className="text-sm text-muted-foreground">People you follow</p>
            </div>
            <p className="font-semibold">{profile?.following_count || 0}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
