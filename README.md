# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
# My Garden · 个人数字花园

> 一个以内容为核心的个人网站，结合**数字花园**与**轻量级作品集**的设计理念，使用 [Astro 7](https://astro.build) 构建。

## ✨ 项目特色

- **四大核心模块**：博客文章、学习笔记、项目展示、关于我
- **Markdown 驱动**：基于 Astro Content Collections，使用 Zod Schema 校验内容元数据
- **暗色/亮色主题**：CSS 变量驱动的主题系统，支持自动检测系统偏好与手动切换
- **响应式布局**：左侧固定侧边栏 + 右侧主内容区，移动端自适应抽屉导航
- **阅读体验优化**：Prose 排版样式、目录导航（TOC）、阅读时长估算
- **SEO 友好**：Open Graph meta 标签、Sitemap 自动生成、RSS 订阅源
- **类型安全**：TypeScript + Zod 全程类型约束

## 🛠 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | [Astro 7](https://astro.build) | 静态站点生成器，Content Collections 内容管理 |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com) | 通过 `@tailwindcss/vite` 插件集成，使用 CSS 变量定义设计令牌 |
| 类型 | [TypeScript](https://www.typescriptlang.org) | 类型安全 |
| 校验 | [Zod](https://zod.dev) | Content Collections 的 Schema 校验 |
| 订阅 | [@astrojs/rss](https://docs.astro.build/en/guides/rss/) | RSS 2.0 订阅源生成 |
| 站点地图 | [@astrojs/sitemap](https://docs.astro.build/en/guides/sitemap/) | 自动生成 Sitemap |

## 📁 目录结构

```
my-site/
├── public/                          # 静态资源（favicon 等）
├── src/
│   ├── assets/
│   │   ├── styles/
│   │   │   └── global.css           # 全局样式：Tailwind 入口、主题变量、Prose 排版
│   │   ├── astro.svg                # Astro Logo
│   │   └── background.svg           # 背景装饰
│   ├── components/
│   │   ├── Sidebar.astro            # 侧边栏导航（桌面端固定 / 移动端抽屉）
│   │   ├── Header.astro             # 移动端顶栏
│   │   ├── Footer.astro             # 页脚
│   │   ├── ThemeToggle.astro        # 主题切换按钮（太阳/月亮图标）
│   │   ├── TagFilter.astro          # 标签筛选器
│   │   ├── PostCard.astro           # 文章卡片
│   │   └── Welcome.astro            # 默认欢迎组件（未使用）
│   ├── content/
│   │   ├── blog/                    # 博客文章（Markdown）
│   │   ├── notes/                   # 学习笔记（Markdown）
│   │   └── projects/                # 项目展示（Markdown）
│   ├── layouts/
│   │   ├── BaseLayout.astro         # 核心布局（侧边栏 + 主内容区 + 主题初始化）
│   │   ├── PostLayout.astro         # 文章/笔记详情页布局（TOC、面包屑）
│   │   └── Layout.astro             # 默认布局（未使用）
│   ├── pages/
│   │   ├── index.astro              # 首页
│   │   ├── about.astro              # 关于页
│   │   ├── 404.astro                # 404 错误页
│   │   ├── rss.xml.js               # RSS 订阅源 (/rss.xml)
│   │   ├── blog/
│   │   │   ├── index.astro          # 博客列表页（按年份分组）
│   │   │   └── [slug].astro         # 博客详情页（动态路由）
│   │   ├── notes/
│   │   │   ├── index.astro          # 笔记列表页（按分类分组）
│   │   │   └── [slug].astro         # 笔记详情页
│   │   └── projects/
│   │       ├── index.astro          # 项目列表页（卡片网格）
│   │       └── [slug].astro         # 项目详情页
│   ├── utils/
│   │   ├── date.ts                  # 日期格式化、分组、排序工具
│   │   └── reading-time.ts          # 阅读时长估算
│   └── content.config.ts            # Content Collections 配置（Schema 定义）
├── astro.config.mjs                 # Astro 项目配置（Tailwind、Sitemap）
├── package.json
└── tsconfig.json
```

## 📝 内容管理

本项目使用 Astro 7 的 **Content Collections** 管理三类结构化内容，所有内容均为 Markdown 文件。

### 博客文章 (blog)

```markdown
---
title: 文章标题
description: 文章摘要（可选）
date: 2026-07-28
tags: [标签1, 标签2]
draft: false
---

正文内容...
```

### 学习笔记 (notes)

```markdown
---
title: 笔记标题
description: 笔记摘要（可选）
category: 分类名称
tags: [标签]
order: 1
draft: false
---

正文内容...
```

### 项目展示 (projects)

```markdown
---
name: 项目名称
description: 项目描述
techStack: [技术1, 技术2]
demoUrl: https://demo.example.com
repoUrl: https://github.com/user/repo
status: active          # active | archived | concept
featured: false
---

项目详细介绍...
```

## 🎨 主题系统

主题系统通过 CSS 自定义属性（Design Tokens）实现，定义在 `src/assets/styles/global.css` 中：

### 切换机制

1. **初始化**：`BaseLayout.astro` 的 `<head>` 内联脚本在页面渲染前同步读取 `localStorage` 或 `prefers-color-scheme`，立即设置 `.dark` 类，防止闪烁（FOUC）。
2. **切换**：通过 `data-theme-toggle` 属性标记按钮，在 `BaseLayout` 的全局脚本中使用**事件委托**统一处理点击。
3. **持久化**：用户偏好存储在 `localStorage` 中。

### 关键技术点

- Tailwind v4 的 `@custom-variant dark (&:where(.dark, .dark *))` 定义暗色模式变体
- `:global(.dark)` 解除 Astro 组件样式隔离，使 `.dark` 类能正确匹配
- 图标切换通过 `opacity` + `transform` 实现淡入淡出与旋转动画

## 📐 响应式设计

| 断点 | 侧边栏 | 主内容区 | 顶栏 |
|------|--------|---------|------|
| **>1024px** 桌面 | 固定左侧 260px | 左侧偏移 260px | 隐藏 |
| **768–1024px** 平板 | 抽屉式隐藏 | 全宽 | 显示 |
| **<768px** 移动 | 抽屉式隐藏 | 全宽，内边距缩减 | 显示 |

## 🚀 快速开始

### 环境要求

- Node.js >= 22.12.0

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（后台模式）
astro dev --background

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

## 📦 部署

构建产物输出到 `./dist/` 目录，可部署到任何静态托管服务：

- **Vercel / Netlify / Cloudflare Pages**：零配置，自动检测 Astro
- **GitHub Pages**：将 `dist/` 推送到 `gh-pages` 分支
- **Nginx**：将 `dist/` 目录配置为静态资源根目录

部署前请确保 `astro.config.mjs` 中的 `site` 字段设置为实际域名：

```javascript
export default defineConfig({
  site: 'https://your-domain.com',  // 修改为实际域名
  // ...
});
```

## ⚙️ 核心配置

### Content Collections (`src/content.config.ts`)

使用 `defineCollection()` 定义三个集合，通过 `glob()` loader 加载 Markdown 文件，Zod Schema 校验 frontmatter 元数据。

### 全局样式 (`src/assets/styles/global.css`)

```css
/* 暗色模式变体 */
@custom-variant dark (&:where(.dark, .dark *));

/* 设计令牌 */
@theme {
  --color-bg: #fafafa;
  --color-accent: #2563eb;
  /* ... */
}

/* 暗色覆盖 */
.dark {
  --color-bg: #09090b;
  /* ... */
}
```

### 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | Hero + 最新文章 + 精选项目 |
| `/blog` | 博客列表 | 按年份分组，支持标签筛选 |
| `/blog/[slug]` | 博客详情 | Markdown 渲染 + TOC + 上下篇 |
| `/notes` | 笔记列表 | 按分类分组 |
| `/notes/[slug]` | 笔记详情 | 同博客详情，标签指向笔记 |
| `/projects` | 项目列表 | 卡片网格，按状态排序 |
| `/projects/[slug]` | 项目详情 | 项目信息 + Markdown 正文 |
| `/about` | 关于页 | 个人介绍 + 技能栈 + 联系方式 |
| `/rss.xml` | RSS 订阅 | RSS 2.0 格式，仅含非草稿文章 |

## 📚 相关资源

- [Astro 文档](https://docs.astro.build)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Tailwind CSS v4](https://tailwindcss.com/docs/upgrade-guide)
- [Zod](https://zod.dev)