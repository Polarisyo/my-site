import { notesSchema, type NoteData } from '../content.config';

export type { NoteData };

export interface NoteInput {
  title: string;
  description?: string;
  category: string;
  tags: string[];
  order?: number;
  draft?: boolean;
  body: string;
}

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

/** 把 NoteInput 序列化为完整 Markdown 文件内容。写入前做 zod 校验。 */
export function serializeNote(input: NoteInput): string {
  // 校验 frontmatter（不含 body）
  const parsed = notesSchema.safeParse({
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags,
    order: input.order,
    draft: input.draft,
  });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  }
  const d = parsed.data;

  const lines: string[] = ['---'];
  lines.push(`title: ${yamlString(d.title)}`);
  if (d.description !== undefined) lines.push(`description: ${yamlString(d.description)}`);
  lines.push(`category: ${yamlString(d.category)}`);
  if (d.tags && d.tags.length > 0) {
    lines.push(`tags: [${d.tags.map((t) => yamlString(t)).join(', ')}]`);
  } else {
    lines.push(`tags: []`);
  }
  if (d.order !== undefined) lines.push(`order: ${d.order}`);
  if (d.draft) lines.push(`draft: true`);
  lines.push('---');
  lines.push('');
  lines.push(input.body.replace(/\s+$/, ''));
  return lines.join('\n') + '\n';
}

export class ValidationError extends Error {}

export interface ParsedNote {
  data: NoteData;
  body: string;
}

/** 解析 Markdown 原文为 frontmatter data + body。简单 YAML 解析，够用即可。 */
export function parseNote(raw: string): ParsedNote {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('无法解析 frontmatter：缺少 --- 分隔符');
  }
  const [, yamlBlock, body] = match;
  const data = parseSimpleYaml(yamlBlock);
  // zod 校验 + 默认值
  const parsed = notesSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('frontmatter 不符合 schema: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  return { data: parsed.data, body };
}

/** 极简 YAML 解析：支持 title/description/category 等标量、tags 流式数组、order/draft。 */
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

/** 生成 slug：留空时回退为 note-YYYYMMDD-HHmmss。 */
export function generateSlug(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `note-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
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
