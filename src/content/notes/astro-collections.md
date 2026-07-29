---
title: Astro 内容集合
description: 使用 Astro Content Collections 构建类型安全的内容驱动网站。
category: 前端/框架
tags: ["Astro", "内容"]
order: 1
---

## 什么是 Content Collections

Content Collections 是 Astro 提供的类型安全内容管理系统。它通过 Zod Schema 定义内容结构，在构建时进行验证。

## 定义 Schema

```typescript
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})
```

## 在页面中使用

```typescript
const posts = await getCollection('blog', ({ data }) => {
  return !data.draft
})
```

## 类型推导

Astro 会根据 Schema 自动推导 TypeScript 类型，编辑器能提供完整的智能提示。