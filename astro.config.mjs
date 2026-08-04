// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://example.com',
  // Vercel adapter：开启 on-demand 渲染（API 路由 / admin 页面 / middleware）。
  // 默认 static 模式不变，按路由用 `export const prerender = false` 单独开 SSR。
  adapter: vercel(),
  // 环境变量：用 astro:env/server 类型安全访问，开发与生产行为一致。
  // secret 仅服务端可见，启动时校验缺失会直接报错（fail fast）。
  env: {
    schema: {
      ADMIN_PASSWORD_HASH: envField.string({ context: 'server', access: 'secret', optional: false }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', optional: false }),
      GITHUB_TOKEN: envField.string({ context: 'server', access: 'secret', optional: false }),
      GITHUB_OWNER: envField.string({ context: 'server', access: 'secret', optional: false }),
      GITHUB_CONTENT_REPO: envField.string({ context: 'server', access: 'secret', optional: false }),
      GITHUB_SITE_REPO: envField.string({ context: 'server', access: 'secret', optional: false }),
      GITHUB_SITE_BRANCH: envField.string({ context: 'server', access: 'secret', optional: false }),
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});