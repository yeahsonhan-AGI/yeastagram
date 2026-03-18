import { Header } from '@/components/layout/Header'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    userProfile = profile
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header user={userProfile} />
      <main className="container mx-auto max-w-screen-xl py-4 px-4">
        {children}
      </main>
      <BottomNavigation username={userProfile?.username} />
    </div>
  )
}
