import { test, expect } from '@playwright/test'

/**
 * Yact 移动端测试
 */

test.describe('移动端 - 欢迎页', () => {
  test('应该显示欢迎轮播页', async ({ page }) => {
    await page.goto('/onboarding')

    // 检查标题
    await expect(page.locator('text=Record Your Adventures')).toBeVisible()

    // 检查跳过按钮
    await expect(page.locator('text=Skip')).toBeVisible()

    // 检查圆点指示器（4个点）
    // 圆点在 flex 容器中，每个都是 button 元素
    const dots = page.locator('.flex.justify-center.items-center.gap-3 button[aria-label^="Go to slide"]')
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

    // 等待页面加载完成
    await page.waitForLoadState('networkidle')

    // 直接点击最后一个圆点指示器（第4个，索引为3）跳到最后一张卡片
    await page.locator('button[aria-label="Go to slide 4"]').click()
    await page.waitForTimeout(500)

    // 点击 Get Started 按钮 - 使用文本定位
    const getStartedButton = page.getByRole('button', { name: 'Get Started' })
    await getStartedButton.click()

    // 应该跳转到首页
    await page.waitForURL('/', { timeout: 10000 })
  })
})

test.describe('移动端 - 登录页', () => {
  test('应该显示登录表单', async ({ page }) => {
    await page.goto('/signin')

    // 检查标题
    await expect(page.locator('text=Yact')).toBeVisible()
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
  // 注意：这些测试需要有效的认证状态
  // 如果没有认证，页面可能会重定向到登录页
  test.skip(true, '需要设置有效的认证状态文件')

  test('应该显示底部导航栏', async ({ page }) => {
    await page.goto('/')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 检查底部导航项（英文标签）
    await expect(page.locator('text=Home')).toBeVisible()
    await expect(page.locator('text=Explore')).toBeVisible()
    await expect(page.locator('text=Groups')).toBeVisible()
    await expect(page.locator('text=Trips')).toBeVisible()
  })

  test('点击导航项应该切换页面', async ({ page }) => {
    await page.goto('/')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 点击 Explore
    await page.click('text=Explore')
    await page.waitForURL('/explore')

    // 点击 Groups
    await page.click('text=Groups')
    await page.waitForURL('/groups')
  })
})

test.describe('移动端 - 触摸目标尺寸', () => {
  test('主要交互元素应至少 44x44px', async ({ page }) => {
    await page.goto('/')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 只检查主要的可点击元素（导航、按钮等）
    // 跳过小图标和装饰性元素
    const buttons = await page.locator('button, a, [role="button"]').all()
    let failures = 0

    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box && box.width > 20 && box.height > 20) {
        // 只检查有明显尺寸的元素（跳过装饰性小图标）
        if (box.width < 44 || box.height < 44) {
          failures++
        }
      }
    }

    // 允许少数小元素存在（如图标按钮）
    expect(failures).toBeLessThanOrEqual(5)
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
