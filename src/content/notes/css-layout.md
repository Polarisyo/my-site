---
title: CSS 布局全解析
description: 从 Flexbox 到 Grid，系统梳理现代 CSS 布局方案。
category: 前端/CSS
tags: ["CSS", "布局"]
order: 1
---

## Flexbox

Flexbox 是一维布局模型，适合组件内部的排列：

```css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 核心概念

- **主轴 (main axis)**：子项排列方向
- **交叉轴 (cross axis)**：垂直于主轴的方向
- **flex-grow/shrink/basis**：控制子项的伸缩行为

## CSS Grid

Grid 是二维布局模型，适合页面整体结构：

```css
.grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1rem;
}
```

### 常见布局模式

1. **侧边栏 + 主内容**：`grid-template-columns`
2. **卡片网格**：`grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
3. **圣杯布局**：命名网格区域

## 什么时候用什么

- 组件内部排列 → Flexbox
- 页面整体结构 → Grid
- 不确定的列表 → Flexbox + `flex-wrap`
- 复杂的对齐需求 → Grid