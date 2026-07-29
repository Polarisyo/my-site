---
title: Vue 响应式原理
description: 深入理解 Vue 3 的响应式系统，从 Proxy 到 effect。
category: 前端/框架
tags: ["Vue", "原理"]
order: 1
---

## 核心架构

Vue 3 的响应式系统基于三个核心部分：

- **reactive**：使用 `Proxy` 创建响应式对象
- **ref**：包装基本类型值
- **effect**：追踪依赖并在变化时触发更新

## Proxy 与 Reflect

相比 Vue 2 的 `Object.defineProperty`，`Proxy` 能拦截更多操作：

```javascript
const target = { message: 'Hello' }
const proxy = new Proxy(target, {
  get(obj, prop) {
    track(obj, prop)
    return Reflect.get(obj, prop)
  },
  set(obj, prop, value) {
    Reflect.set(obj, prop, value)
    trigger(obj, prop)
    return true
  }
})
```

## 依赖收集

当一个 `effect` 执行时，它会：

1. 标记自己为活跃的 effect
2. 访问响应式对象属性时，自动收集依赖
3. 将 (target, key) → effects 的映射存储在 `WeakMap` 中

## 调度与性能

Vue 通过 `queueFlush` 将多个更新合并在下一个微任务中执行，避免冗余计算。