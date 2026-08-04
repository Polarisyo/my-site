import type { APIRoute } from 'astro';
import { COLLECTIONS } from '../../../server/collections';
import { listContent, createContent } from '../../../server/github';
import { serialize, generateSlug, sanitizeSlug } from '../../../server/markdown';
import { writeLocalContent } from '../../../server/local-sync';
import { json, readBody, writeResponse, errorResponse } from '../../../server/content-api';

export const prerender = false;

const CONFIG = COLLECTIONS.projects;

// GET /api/projects —— 列出全部项目元信息（live 从 GitHub 读）
export const GET: APIRoute = async () => {
  try {
    const projects = await listContent(CONFIG);
    return json({ projects });
  } catch (e) {
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
};

// POST /api/projects —— 创建项目
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: '请求体不是合法 JSON' }, 400);
  }

  const input = readBody(CONFIG, body);

  let md: string;
  try {
    md = serialize(CONFIG, input);
  } catch (e) {
    return errorResponse(e);
  }

  const rawSlug = body?.slug ? sanitizeSlug(String(body.slug)) : '';
  const slug = rawSlug || generateSlug(CONFIG.slugPrefix);

  try {
    const result = await createContent(CONFIG, slug, md);
    writeLocalContent(CONFIG, slug, md);
    return writeResponse(result);
  } catch (e) {
    return errorResponse(e);
  }
};
