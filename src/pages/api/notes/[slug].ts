import type { APIRoute } from 'astro';
import { getNote, updateNote, deleteNote, GitHubError, type WriteResult } from '../../../server/github';
import { serializeNote, ValidationError, type NoteInput } from '../../../server/markdown';
import { writeLocalNote, deleteLocalNote } from '../../../server/local-sync';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}
function normalizeOrder(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function fromBody(body: any): NoteInput {
  return {
    title: String(body?.title ?? '').trim(),
    description: body?.description ? String(body.description).trim() : undefined,
    category: String(body?.category ?? '').trim(),
    tags: normalizeTags(body?.tags),
    order: normalizeOrder(body?.order),
    draft: body?.draft === true || body?.draft === 'true',
    body: String(body?.body ?? ''),
  };
}

function writeResponse(result: WriteResult): Response {
  if (!result.bumped) {
    return json(
      {
        ok: false,
        error: `内容已保存到 dataInMySite（commit ${result.contentSha.slice(0, 7)}），但更新主仓库 submodule 指针失败：${result.bumpError}。请手动运行 scripts/bump-content.ps1 触发重建。`,
        slug: result.slug,
      },
      500,
    );
  }
  return json({ ok: true, slug: result.slug }, 200);
}

// GET /api/notes/[slug] —— 取单篇（含 sha，供编辑预填）
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug as string;
  try {
    const note = await getNote(slug);
    if (!note) return json({ error: '笔记不存在' }, 404);
    return json({
      slug: note.slug,
      sha: note.sha,
      data: note.data,
      body: note.body,
    });
  } catch (e) {
    if (e instanceof GitHubError) {
      return json({ error: `GitHub API 错误：${e.statusText}`, status: e.status }, 502);
    }
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
};

// PUT /api/notes/[slug] —— 更新（需带 sha 防并发覆盖）
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

  const input = fromBody(body);
  let md: string;
  try {
    md = serializeNote(input);
  } catch (e) {
    if (e instanceof ValidationError) return json({ error: '数据校验失败：' + e.message }, 400);
    throw e;
  }

  try {
    const result = await updateNote(slug, md, sha);
    writeLocalNote(slug, md);
    return writeResponse(result);
  } catch (e) {
    if (e instanceof GitHubError) {
      if (e.status === 409) return json({ error: 'sha 不匹配，文件可能已被修改，请刷新后重试' }, 409);
      if (e.status === 404) return json({ error: '笔记不存在' }, 404);
      return json({ error: `GitHub API 错误：${e.statusText}`, status: e.status }, 502);
    }
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
};

// DELETE /api/notes/[slug] —— 删除（服务端自取 sha）
export const DELETE: APIRoute = async ({ params }) => {
  const slug = params.slug as string;
  try {
    const result = await deleteNote(slug);
    deleteLocalNote(slug);
    return writeResponse(result);
  } catch (e) {
    if (e instanceof GitHubError) {
      if (e.status === 404) return json({ error: '笔记不存在' }, 404);
      return json({ error: `GitHub API 错误：${e.statusText}`, status: e.status }, 502);
    }
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
};
