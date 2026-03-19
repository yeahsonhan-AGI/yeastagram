# 📱 Yact 移动端测试指南

本文档介绍如何在 Windows 上使用 Playwright 测试 Yact 的移动端体验。

---

## 🛠️ 工具安装

### 1. Playwright 已安装
```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. 其他推荐工具

| 工具 | 用途 | 安装命令 |
|------|------|----------|
| **Responsively App** | 多设备预览 | `winget install ResponsivelyApp.ResponsivelyApp` |
| **Chrome DevTools** | 设备模拟 | Chrome 内置 |
| **Android Studio** | 真实模拟器 | [下载](https://developer.android.com/studio) |

---

## 🚀 快速开始

### 方式 1: 命令行测试（推荐）

```bash
# 运行所有移动端测试
npm run test:mobile

# 以 UI 模式运行（可视化）
npm run test:ui

# 以 headed 模式运行（显示浏览器）
npm run test:headed

# 调试模式
npm run test:debug
```

### 方式 2: Playwright Inspector（录制操作）

```bash
# 启动开发服务器
npm run dev

# 在另一个终端启动 Inspector
npx playwright codegen http://localhost:3000

# 现在可以：
# 1. 在模拟器中操作
# 2. Playwright 自动生成代码
# 3. 复制代码到测试文件
```

### 方式 3: Chrome DevTools

```bash
# 启动 Chrome 并开启调试
chrome --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug" "http://localhost:3000"

# 然后按 F12 → Ctrl+Shift+M 开启设备模拟
```

---

## 📊 支持的设备

Playwright 配置已预设以下设备：

| 项目 | 设备 | 屏幕尺寸 | User Agent |
|------|------|----------|------------|
| Mobile Safari | iPhone 14 Pro | 393×852 | iOS Safari |
| Mobile Chrome | Galaxy S21 | 360×800 | Android Chrome |
| iPad | iPad Pro 11 | 834×1194 | iPad Safari |
| Small Mobile | iPhone SE | 375×667 | iOS Safari |

---

## 📝 测试文件说明

```
tests/
└── mobile/
    └── app.spec.ts    # 移动端测试套件
```

### 测试覆盖范围

| 测试组 | 内容 |
|--------|------|
| 欢迎页 | 轮播显示、滑动切换、跳过功能 |
| 登录页 | 表单验证、无 OAuth 选项 |
| 底部导航 | 导航显示、页面切换 |
| 触摸目标 | 最小 44×44px 尺寸 |
| 手势操作 | 下拉刷新、左右滑动 |

---

## 🎯 Claude Code 使用方式

Claude Code 可以直接运行 Playwright 命令：

### 1. 运行测试
```bash
# Claude 可以执行
npm run test:mobile
```

### 2. 生成测试代码
```bash
# 启动代码生成
npx playwright codegen http://localhost:3000 --target=javascript
```

### 3. 调试特定页面
```bash
# 调试登录页
npx playwright test --grep "登录页" --debug
```

---

## 🔍 常见调试场景

### 场景 1: 测试触摸手势

```typescript
// 向左滑动
await page.touchscreen.tap(300, 500)
await page.touchscreen.tap(200, 500)

// 捏合缩放
await page.touchscreen.tap(200, 300)
await page.touchscreen.tap(400, 300)
```

### 场景 2: 模拟网络条件

```typescript
// 模拟慢速 3G
await page.route('**/*', route => {
  route.continue({
    // 下载速度 1.6 Mbps, 上传 750 Kbps, 延迟 100ms
    throughput: (1.6 * 1024 * 1024) / 8,
    latency: 100
  })
})
```

### 场景 3: 截图对比

```typescript
// 截图保存
await page.screenshot({
  path: 'tests/screenshots/mobile-home.png',
  fullPage: true
})

// 视觉回归测试
await expect(page).toHaveScreenshot('mobile-home.png')
```

---

## 📱 实际设备测试

### 通过 WiFi 测试

1. **确保手机和电脑在同一 WiFi**

2. **获取电脑 IP 地址**
```bash
ipconfig
# 找到 IPv4 地址，如 192.168.1.100
```

3. **启动开发服务器**
```bash
npm run dev -- -H 0.0.0.0
```

4. **手机浏览器访问**
```
http://192.168.1.100:3000
```

### 使用 Ngrok（公网访问）

```bash
# 安装 ngrok
winget install Ngrok.Ngrok

# 启动隧道
ngrok http 3000

# 手机访问生成的 URL
```

---

## 🎬 录制测试视频

```bash
# 测试时自动录制视频
npx playwright test --project="Mobile Chrome" --video=on

# 视频保存在
# test-results/
```

---

## 📊 测试报告

```bash
# 生成 HTML 报告
npx playwright test --reporter=html

# 查看报告
npx playwright show-report
```

---

## 🔧 配置自定义设备

编辑 `playwright.config.ts`：

```typescript
{
  name: 'Custom Device',
  use: {
    viewport: { width: 414, height: 896 },  // iPhone 13
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Custom User Agent'
  },
}
```

---

## 📚 参考资源

- [Playwright 官方文档](https://playwright.dev)
- [Playwright 设模拟模拟](https://playwright.dev/docs/emulation)
- [Yact 源码](https://github.com/yeahsonhan-AGI/yact)

---

**更新时间**: 2026-03-18
