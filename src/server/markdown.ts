import type { CollectionConfig, FieldSpec } from './collections';
import type { BlogData, NoteData, ProjectData } from '../content.config';

/** 写入接口：frontmatter 字段 + body。具体字段由集合 config 描述。 */
export interface CollectionInput {
  body: string;
  [key: string]: unknown;
}

/** 解析结果：zod 校验后的 data + 原文 body。data 用联合类型保留字段提示。 */
export interface ParsedContent {
  data: Partial<BlogData & NoteData & ProjectData>;
  body: string;
}

export class ValidationError extends Error {}

/** 需要双引号包裹的 YAML 标量字符。 */
function needsQuote(s: string): boolean {
  if (s === '') return true;
  // YAML 会把纯数字、布尔、null 等自动解析成对应类型，字符串值必须加引号
  if (/^-?\d+(\.\d+)?$/.test(s)) return true; // 整数 / 小数
  if (/^(true|false|null|yes|no|on|off)$/i.test(s)) return true; // 布尔 / null
  // 含冒号、#、引号、换行、首尾空格、或以 YAML 特殊字符开头，需引号
  return /[:#"\n]|^\s|\s$|^[!&*?|>%@`"'{}\[\],-]/.test(s);
}

function yamlString(s: string): string {
  if (needsQuote(s)) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return s;
}

/** 把日期格式化为 YYYY-MM-DD（blog.date 用）。 */
function formatDate(val: unknown): string {
  let d: Date;
  if (val instanceof Date) d = val;
  else if (typeof val === 'string') d = new Date(val);
  else d = new Date(String(val));
  if (isNaN(d.getTime())) return String(val);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 序列化单个字段为 0 或 1 行 YAML。 */
function serializeField(f: FieldSpec, val: unknown): string[] {
  switch (f.kind) {
    case 'string':
    case 'url':
    case 'enum': {
      if (val === undefined || val === null) return [];
      const s = String(val);
      if (s === '' && f.optional) return [];
      if (s === '') return [];
      return [`${f.key}: ${yamlString(s)}`];
    }
    case 'string[]': {
      const arr = Array.isArray(val) ? val.map(String) : [];
      if (arr.length === 0) return [`${f.key}: []`];
      return [`${f.key}: [${arr.map((t) => yamlString(t)).join(', ')}]`];
    }
    case 'number': {
      if (val === undefined || val === null || val === '') return [];
      const n = Number(val);
      if (!Number.isFinite(n)) return [];
      return [`${f.key}: ${n}`];
    }
    case 'boolean': {
      // 仅在 true 时输出；false 由 schema 默认值覆盖，省略更干净
      if (val === true) return [`${f.key}: true`];
      return [];
    }
    case 'date': {
      if (val === undefined || val === null || val === '') return [];
      return [`${f.key}: ${formatDate(val)}`];
    }
    default:
      return [];
  }
}

/** 把 CollectionInput 序列化为完整 Markdown 文件内容。写入前做 zod 校验。 */
export function serialize(config: CollectionConfig, input: CollectionInput): string {
  // 组装 frontmatter 对象（按 config.fields 取值）
  const fm: Record<string, unknown> = {};
  for (const f of config.fields) {
    fm[f.key] = input[f.key];
  }

  const parsed = config.schema.safeParse(fm);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  }
  const d = parsed.data as Record<string, unknown>;

  const lines: string[] = ['---'];
  for (const f of config.fields) {
    lines.push(...serializeField(f, d[f.key]));
  }
  lines.push('---');
  lines.push('');
  lines.push(String(input.body || '').replace(/\s+$/, ''));
  return lines.join('\n') + '\n';
}

/** 解析 Markdown 原文为 frontmatter data + body。简单 YAML 解析 + zod 校验。 */
export function parse(config: CollectionConfig, raw: string): ParsedContent {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('无法解析 frontmatter：缺少 --- 分隔符');
  }
  const [, yamlBlock, body] = match;
  const data = parseSimpleYaml(yamlBlock);
  const parsed = config.schema.safeParse(data);
  if (!parsed.success) {
    throw new Error('frontmatter 不符合 schema: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  return { data: parsed.data as ParsedContent['data'], body };
}

/** frontmatter 解析失败时的兜底 data，让编辑页仍能加载（用户可手动修复）。 */
export function fallbackData(config: CollectionConfig, slug: string): ParsedContent['data'] {
  const today = formatDate(new Date());
  switch (config.dir) {
    case 'blog':
      return { title: slug, date: today, tags: [], draft: false };
    case 'notes':
      return { title: slug, category: '未分类', tags: [], draft: false };
    case 'projects':
      return { name: slug, description: '', techStack: [], repoUrl: '', status: 'active', featured: false };
    default:
      return { title: slug };
  }
}

/** 极简 YAML 解析：支持标量、流式数组、布尔/数字字面量。 */
function parseSimpleYaml(block: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value === '') continue;

    // 流式数组 [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      if (inner === '') {
        out[key] = [];
        continue;
      }
      out[key] = inner.split(',').map((s) => unquote(s.trim()));
      continue;
    }

    value = unquote(value);
    if (value === 'true') out[key] = true;
    else if (value === 'false') out[key] = false;
    else if (/^-?\d+$/.test(value)) out[key] = Number(value);
    else out[key] = value;
  }
  return out;
}

function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    const inner = s.slice(1, -1);
    return s.startsWith('"') ? inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\') : inner;
  }
  return s;
}

/** 生成 slug：留空时回退为 {prefix}-YYYYMMDD-HHmmss。 */
export function generateSlug(prefix = 'note'): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** 清理用户输入 slug：只保留 a-z0-9-，小写，去首尾连字符。 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
