import type { APIRoute } from 'astro';
import { listNotes, createNote, GitHubError, type WriteResult } from '../../../server/github';
import { serializeNote, generateSlug, sanitizeSlug, ValidationError, type NoteInput } from '../../../server/markdown';
import { writeLocalNote } from '../../../server/local-sync';

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

// GET /api/notes —— 列出全部笔记元信息（live 从 GitHub 读）
export const GET: APIRoute = async () => {
  try {
    const notes = await listNotes();
    return json({ notes });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
};

// POST /api/notes —— 创建笔记
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: '请求体不是合法 JSON' }, 400);
  }

  const input = fromBody(body);

  let md: string;
  try {
    md = serializeNote(input);
  } catch (e) {
    if (e instanceof ValidationError) return json({ error: '数据校验失败：' + e.message }, 400);
    throw e;
  }

  const rawSlug = body?.slug ? sanitizeSlug(String(body.slug)) : '';
  const slug = rawSlug || generateSlug();

  try {
    const result = await createNote(slug, md);
    writeLocalNote(slug, md);
    return writeResponse(result);
  } catch (e) {
    if (e instanceof GitHubError && e.status === 409) {
      return json({ error: `slug "${slug}" 已存在，请换一个` }, 409);
    }
    if (e instanceof GitHubError) {
      return json({ error: `GitHub API 错误：${e.statusText}`, status: e.status }, 502);
    }
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
};
