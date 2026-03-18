import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTripForm } from '@/components/trips/CreateTripForm'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export default async function CreateTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="flex items-center space-x-2">
        <MapPin className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Create New Trip</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CreateTripForm />
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">💡 Tip:</p>
        <p>After creating your trip, you can add daily logs with detailed information like locations, distance, weather, photos, and notes.</p>
      </div>
    </div>
  )
}
