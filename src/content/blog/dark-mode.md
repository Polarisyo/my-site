---
title: 搭建暗色模式的一些思考
description: 如何优雅地实现暗色模式切换，避免闪烁，提升用户体验。
date: 2026-07-25
tags: ["前端", "CSS", "设计"]
---

## 暗色模式不仅仅是颜色反转

一个好的暗色模式需要考虑：

1. **对比度**：文字背景之间需要足够的对比度，但不能刺眼
2. **饱和度**：暗色下高饱和度色彩容易引起视觉疲劳
3. **层级**：通过不同灰度的背景色来表达信息层级

## 实现策略

### CSS 变量 + class 切换

使用 CSS 自定义属性管理主题色，通过在 `<html>` 上切换 `dark` 类名来改变主题：

```css
:root {
  --bg: #fafafa;
  --text: #18181b;
}

.dark {
  --bg: #09090b;
  --text: #fafafa;
}
```

### 避免闪烁

在页面加载前同步执行主题初始化脚本，读取 `localStorage` 中的偏好：

```html
<script>
  var theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
</script>
```

这段脚本必须放在 `<head>` 中，且标记为 `is:inline` 防止被 Astro 处理。

## 与系统偏好同步

首次访问时可以检测 `prefers-color-scheme` 媒体查询，将其作为默认值。