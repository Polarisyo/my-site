import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CollectionConfig } from './collections';

const CONTENT_ROOT = resolve(process.cwd(), 'src/content');

function dirFor(config: CollectionConfig): string {
  return resolve(CONTENT_ROOT, config.dir);
}

/**
 * dev 模式下把写操作镜像到本地 src/content/{dir}/，
 * 让 Astro 内容集合监听器自动重同步，公开列表与 admin 列表立即反映变更。
 * 生产环境（Vercel）跳过——靠 bump commit 触发重建更新。
 *
 * 同步失败只打 warn，不影响主流程（远端 GitHub 已是事实来源）。
 */
export function writeLocalContent(config: CollectionConfig, slug: string, md: string): void {
  if (!import.meta.env.DEV) return;
  try {
    const dir = dirFor(config);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${slug}.md`), md, 'utf8');
  } catch (e) {
    console.warn(`[local-sync] 写入本地 ${config.dir} 失败:`, e);
  }
}

export function deleteLocalContent(config: CollectionConfig, slug: string): void {
  if (!import.meta.env.DEV) return;
  try {
    const p = resolve(dirFor(config), `${slug}.md`);
    if (existsSync(p)) unlinkSync(p);
  } catch (e) {
    console.warn(`[local-sync] 删除本地 ${config.dir} 失败:`, e);
  }
}
