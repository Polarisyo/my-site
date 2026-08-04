import type { CollectionConfig, FieldSpec } from './collections';
import type { CollectionInput } from './markdown';
import { ValidationError } from './markdown';
import { GitHubError, type WriteResult } from './github';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeNumber(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeBoolean(v: unknown): boolean {
  return v === true || v === 'true';
}

/** 按字段类型把请求体归一化为 CollectionInput（不含 slug/sha，那些由路由处理）。 */
export function readBody(config: CollectionConfig, body: any): CollectionInput {
  const input: CollectionInput = { body: String(body?.body ?? '') };
  for (const f of config.fields) {
    input[f.key] = normalizeField(f, body?.[f.key]);
  }
  return input;
}

function normalizeField(f: FieldSpec, v: unknown): unknown {
  switch (f.kind) {
    case 'string':
      return v == null ? '' : String(v).trim();
    case 'url':
    case 'enum':
      // 空值转 undefined：让 zod 的 .optional() / .default() 正确生效
      // （否则空字符串会被当成非法 URL / 非法枚举值报错）
      return v == null || v === '' ? undefined : String(v).trim();
    case 'string[]':
      return normalizeStringArray(v);
    case 'number':
      return normalizeNumber(v);
    case 'boolean':
      return normalizeBoolean(v);
    case 'date':
      return v == null || v === '' ? undefined : String(v).trim();
    default:
      return v;
  }
}

/** 写操作结果的统一响应：bump 失败时返回 500 + 手动修复提示。 */
export function writeResponse(result: WriteResult): Response {
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

/** 把 GitHubError / ValidationError / 未知错误归一化为 JSON 响应。 */
export function errorResponse(e: unknown): Response {
  if (e instanceof ValidationError) {
    return json({ error: '数据校验失败：' + e.message }, 400);
  }
  if (e instanceof GitHubError) {
    if (e.status === 409) {
      return json({ error: `slug 已存在，请换一个` }, 409);
    }
    if (e.status === 404) {
      return json({ error: '内容不存在' }, 404);
    }
    return json({ error: `GitHub API 错误：${e.statusText}`, status: e.status }, 502);
  }
  return json({ error: (e as Error)?.message || String(e) }, 500);
}
