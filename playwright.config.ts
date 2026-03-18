import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置 - 移动端测试
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 桌面版 Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 移动端 - iPhone 14 Pro
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14 Pro'] },
    },

    // 移动端 - Samsung Galaxy S21
    {
      name: 'Mobile Chrome',
      use: { ...devices['Galaxy S21'] },
    },

    // 移动端 - iPad
    {
      name: 'iPad',
      use: { ...devices['iPad Pro 11'] },
    },

    // 小屏手机
    {
      name: 'Small Mobile',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  // 启动开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
