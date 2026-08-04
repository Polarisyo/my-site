import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const NOTES_DIR = resolve(process.cwd(), 'src/content/notes');

/**
 * dev 模式下把写操作镜像到本地 src/content/notes/，
 * 让 Astro 内容集合监听器自动重同步，/notes 与 /admin/notes 立即反映变更。
 * 生产环境（Vercel）跳过——靠 bump commit 触发重建更新。
 *
 * 同步失败只打 warn，不影响主流程（远端 GitHub 已是事实来源）。
 */
export function writeLocalNote(slug: string, md: string): void {
  if (!import.meta.env.DEV) return;
  try {
    mkdirSync(NOTES_DIR, { recursive: true });
    writeFileSync(resolve(NOTES_DIR, `${slug}.md`), md, 'utf8');
  } catch (e) {
    console.warn('[local-sync] 写入本地笔记失败:', e);
  }
}

export function deleteLocalNote(slug: string): void {
  if (!import.meta.env.DEV) return;
  try {
    const p = resolve(NOTES_DIR, `${slug}.md`);
    if (existsSync(p)) unlinkSync(p);
  } catch (e) {
    console.warn('[local-sync] 删除本地笔记失败:', e);
  }
}
