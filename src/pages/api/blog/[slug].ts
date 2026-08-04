import type { APIRoute } from 'astro';
import { COLLECTIONS } from '../../../server/collections';
import { getContent, updateContent, deleteContent } from '../../../server/github';
import { serialize } from '../../../server/markdown';
import { writeLocalContent, deleteLocalContent } from '../../../server/local-sync';
import { json, readBody, writeResponse, errorResponse } from '../../../server/content-api';

export const prerender = false;

const CONFIG = COLLECTIONS.blog;

// GET /api/blog/[slug] —— 取单篇（含 sha，供编辑预填）
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug as string;
  try {
    const post = await getContent(CONFIG, slug);
    if (!post) return json({ error: '文章不存在' }, 404);
    return json({
      slug: post.slug,
      sha: post.sha,
      data: post.data,
      body: post.body,
    });
  } catch (e) {
    return errorResponse(e);
  }
};

// PUT /api/blog/[slug] —— 更新（需带 sha 防并发覆盖）
export const PUT: APIRoute = async ({ params, request }) => {
  const slug = params.slug as string;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: '请求体不是合法 JSON' }, 400);
  }

  const sha = body?.sha;
  if (typeof sha !== 'string' || !sha) {
    return json({ error: '缺少 sha（编辑表单需携带当前文件 sha）' }, 400);
  }

  const input = readBody(CONFIG, body);
  let md: string;
  try {
    md = serialize(CONFIG, input);
  } catch (e) {
    return errorResponse(e);
  }

  try {
    const result = await updateContent(CONFIG, slug, md, sha);
    writeLocalContent(CONFIG, slug, md);
    return writeResponse(result);
  } catch (e) {
    return errorResponse(e);
  }
};

// DELETE /api/blog/[slug] —— 删除（服务端自取 sha）
export const DELETE: APIRoute = async ({ params }) => {
  const slug = params.slug as string;
  try {
    const result = await deleteContent(CONFIG, slug);
    deleteLocalContent(CONFIG, slug);
    return writeResponse(result);
  } catch (e) {
    return errorResponse(e);
  }
};
