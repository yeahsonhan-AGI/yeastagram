'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Home, Compass, Users, MapPin, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

const onboardingSteps = [
  {
    icon: Home,
    emoji: '🏠',
    title: 'Welcome to Yeahstagram',
    description: 'Share your outdoor adventures and connect with fellow explorers.',
    color: 'bg-green-100 dark:bg-green-900',
  },
  {
    icon: Compass,
    emoji: '🧭',
    title: 'Discover New Places',
    description: 'Explore amazing trips and find inspiration for your next adventure.',
    color: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    icon: Users,
    emoji: '👥',
    title: 'Join Groups',
    description: 'Connect with like-minded adventurers and join exciting group trips.',
    color: 'bg-purple-100 dark:bg-purple-900',
  },
  {
    icon: MapPin,
    emoji: '📍',
    title: 'Track Your Trips',
    description: 'Document your journeys with photos, routes, and memories.',
    color: 'bg-orange-100 dark:bg-orange-900',
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has already seen onboarding
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('has_seen_onboarding')
        .eq('id', user.id)
        .single()

      if (profile?.has_seen_onboarding) {
        router.push('/')
      }
    }

    checkOnboarding()
  }, [router, supabase])

  const handleNext = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Mark onboarding as complete
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ has_seen_onboarding: true })
          .eq('id', user.id)
      }
      router.push('/')
    }
  }

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ has_seen_onboarding: true })
        .eq('id', user.id)
    }
    router.push('/')
  }

  const step = onboardingSteps[currentStep]
  const Icon = step.icon

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                  ? 'w-2 bg-primary'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <Card className="overflow-hidden">
          <div className={cn('p-8 text-center', step.color)}>
            <div className="text-6xl mb-4">{step.emoji}</div>
            <Icon className="h-12 w-12 mx-auto mb-4 text-primary" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          <div className="p-6 space-y-4">
            <Button
              onClick={handleNext}
              className="w-full rounded-full"
              size="lg"
            >
              {currentStep < onboardingSteps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Get Started'
              )}
            </Button>

            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="w-full"
              >
                Back
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>
        </Card>

        {/* Swipe hint */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {currentStep < onboardingSteps.length - 1 && (
            <>Swipe or tap Next to continue</>
          )}
        </p>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
