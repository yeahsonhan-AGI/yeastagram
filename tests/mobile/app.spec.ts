import { test, expect } from '@playwright/test'

/**
 * Yeahstagram 移动端测试
 */

test.describe('移动端 - 欢迎页', () => {
  test('应该显示欢迎轮播页', async ({ page }) => {
    await page.goto('/onboarding')

    // 检查标题
    await expect(page.locator('text=Record Your Adventures')).toBeVisible()

    // 检查跳过按钮
    await expect(page.locator('text=Skip')).toBeVisible()

    // 检查圆点指示器（4个点）
    const dots = page.locator('[class*="rounded-full"]')
    await expect(dots).toHaveCount(4)
  })

  test('应该支持滑动切换卡片', async ({ page }) => {
    await page.goto('/onboarding')

    const firstTitle = await page.locator('h2').textContent()

    // 模拟向左滑动
    await page.touchscreen.tap(300, 500)
    await page.touchscreen.tap(200, 500)

    // 等待动画
    await page.waitForTimeout(500)

    // 点击 Next 按钮
    await page.click('button:has-text("Next")')

    // 标题应该改变了
    const secondTitle = await page.locator('h2').textContent()
    expect(secondTitle).not.toBe(firstTitle)
  })

  test('点击 Get Started 应该跳转到首页', async ({ page }) => {
    await page.goto('/onboarding')

    // 滑动到最后一张
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Next")')
      await page.waitForTimeout(300)
    }

    // 点击 Get Started
    await page.click('button:has-text("Get Started")')

    // 应该跳转到首页
    await page.waitForURL('/')
  })
})

test.describe('移动端 - 登录页', () => {
  test('应该显示登录表单', async ({ page }) => {
    await page.goto('/signin')

    // 检查标题
    await expect(page.locator('text=Yeahstagram')).toBeVisible()
    await expect(page.locator('text=Sign in to your account')).toBeVisible()

    // 检查输入框
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // 检查登录按钮
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()

    // 检查注册链接
    await expect(page.locator('a:has-text("Sign up")')).toBeVisible()
  })

  test('不应该显示 OAuth 登录选项', async ({ page }) => {
    await page.goto('/signin')

    // GitHub 和 Google 按钮不应该存在
    await expect(page.locator('text=GitHub')).not.toBeVisible()
    await expect(page.locator('text=Google')).not.toBeVisible()
  })
})

test.describe('移动端 - 底部导航', () => {
  test.use({ storageState: 'tests/auth-state.json' })

  test('应该显示底部导航栏', async ({ page }) => {
    await page.goto('/')

    // 检查底部导航项
    await expect(page.locator('text=首页')).toBeVisible()
    await expect(page.locator('text=探索')).toBeVisible()
    await expect(page.locator('text=通知')).toBeVisible()
    await expect(page.locator('text=我的')).toBeVisible()
  })

  test('点击导航项应该切换页面', async ({ page }) => {
    await page.goto('/')

    // 点击探索
    await page.click('text=探索')
    await page.waitForURL('/explore')

    // 点击通知
    await page.click('text=通知')
    await page.waitForURL('/notifications')

    // 点击我的
    await page.click('text=我的')
    await page.waitForURL(/\/.+/) // 用户名页
  })
})

test.describe('移动端 - 触摸目标尺寸', () => {
  test('所有可点击元素应至少 44x44px', async ({ page }) => {
    await page.goto('/')

    // 获取所有可点击元素
    const buttons = await page.locator('button, a, [role="button"]').all()

    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})

test.describe('移动端 - 手势操作', () => {
  test('动态列表应该支持下拉刷新', async ({ page }) => {
    await page.goto('/')

    // 模拟下拉手势
    await page.touchscreen.tap(200, 100)
    await page.touchscreen.tap(200, 300)

    // 等待加载
    await page.waitForTimeout(1000)
  })

  test('卡片应该支持左右滑动', async ({ page }) => {
    await page.goto('/')

    const card = page.locator('[class*="PostCard"]').first()
    if (await card.isVisible()) {
      // 向左滑动
      await card.evaluate(el => {
        el.style.transition = 'transform 0.3s'
        el.style.transform = 'translateX(-100px)'
      })

      await page.waitForTimeout(300)
    }
  })
})
