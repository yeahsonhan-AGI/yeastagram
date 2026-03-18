'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link2, Users, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/server'

export default function JoinGroupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [isLoading, setIsLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState(code || '')
  const [groupName, setGroupName] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (code) {
      setInviteCode(code)
      validateInviteCode(code)
    }
  }, [code])

  const validateInviteCode = async (inviteCode: string) => {
    if (!inviteCode || inviteCode.length < 6) return

    setIsValidating(true)
    try {
      const response = await fetch(`/api/groups/invite/validate?code=${inviteCode}`)
      if (response.ok) {
        const data = await response.json()
        setGroupName(data.group?.name || null)
      }
    } catch (error) {
      console.error('Error validating invite:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode || inviteCode.length < 6) {
      toast.error('请输入有效的邀请码')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/groups/join/by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '加入失败')
      }

      toast.success('成功加入队伍！正在跳转...')

      // Redirect to the group page
      if (data.member?.group_id) {
        router.push(`/groups/${data.member.group_id}`)
      } else {
        router.push('/groups')
      }
    } catch (error) {
      console.error('Join error:', error)
      toast.error(error instanceof Error ? error.message : '加入失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toUpperCase()
    setInviteCode(newCode)
    setGroupName(null)

    if (newCode.length >= 6) {
      validateInviteCode(newCode)
    }
  }

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>加入队伍</CardTitle>
          <CardDescription>
            通过邀请链接或邀请码加入队伍
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {code ? (
            <>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">你被邀请加入一个队伍</p>
                <code className="text-lg font-mono font-bold">{code}</code>
              </div>

              {groupName && (
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    邀请加入队伍：<strong>{groupName}</strong>
                  </p>
                </div>
              )}

              <Button
                onClick={handleJoin}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? '加入中...' : '确认加入'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">邀请码</label>
                <Input
                  placeholder="输入8位邀请码"
                  value={inviteCode}
                  onChange={handleCodeChange}
                  maxLength={8}
                  className="text-center text-lg font-mono uppercase"
                  disabled={isLoading}
                />
                {isValidating && (
                  <p className="text-xs text-muted-foreground">验证邀请码...</p>
                )}
              </div>

              {groupName && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    邀请加入队伍：<strong>{groupName}</strong>
                  </p>
                </div>
              )}

              <Button
                onClick={handleJoin}
                disabled={isLoading || inviteCode.length < 6}
                className="w-full"
                size="lg"
              >
                {isLoading ? '加入中...' : '加入队伍'}
              </Button>
            </>
          )}

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>邀请链接由队长生成，可用于快速加入队伍</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
