import { z } from 'astro/zod';
import { blogSchema, notesSchema, projectsSchema } from '../content.config';

/** 内容集合名：与 dataInMySite 子模块下的目录一一对应。 */
export type CollectionName = 'notes' | 'blog' | 'projects';

/** 字段在 YAML frontmatter 中的输出类型。 */
export type FieldKind = 'string' | 'string[]' | 'number' | 'boolean' | 'date' | 'url' | 'enum';

export interface FieldSpec {
  key: string;
  kind: FieldKind;
  optional?: boolean;
  /** kind === 'enum' 时的合法取值。 */
  options?: string[];
}

export interface CollectionConfig {
  /** dataInMySite 下的目录名，也是 URL 段（/api/{dir}、/admin/{dir}）。 */
  dir: string;
  /** 中文名（复数）：日常 / 笔记 / 项目。 */
  label: string;
  /** 单条记录的中文名：文章 / 笔记 / 项目。 */
  singularLabel: string;
  /** 自动生成 slug 时的前缀。 */
  slugPrefix: string;
  /** GitHub commit message 前缀。 */
  commitPrefix: string;
  /** zod schema，写入前校验 + 解析时校验。 */
  schema: z.ZodType;
  /** YAML 输出顺序与字段类型。 */
  fields: FieldSpec[];
}

export const COLLECTIONS: Record<CollectionName, CollectionConfig> = {
  blog: {
    dir: 'blog',
    label: '日常',
    singularLabel: '文章',
    slugPrefix: 'post',
    commitPrefix: 'post',
    schema: blogSchema,
    fields: [
      { key: 'title', kind: 'string' },
      { key: 'description', kind: 'string', optional: true },
      { key: 'date', kind: 'date' },
      { key: 'tags', kind: 'string[]', optional: true },
      { key: 'draft', kind: 'boolean', optional: true },
    ],
  },
  notes: {
    dir: 'notes',
    label: '笔记',
    singularLabel: '笔记',
    slugPrefix: 'note',
    commitPrefix: 'note',
    schema: notesSchema,
    fields: [
      { key: 'title', kind: 'string' },
      { key: 'description', kind: 'string', optional: true },
      { key: 'category', kind: 'string' },
      { key: 'tags', kind: 'string[]', optional: true },
      { key: 'order', kind: 'number', optional: true },
      { key: 'draft', kind: 'boolean', optional: true },
    ],
  },
  projects: {
    dir: 'projects',
    label: '项目',
    singularLabel: '项目',
    slugPrefix: 'project',
    commitPrefix: 'project',
    schema: projectsSchema,
    fields: [
      { key: 'name', kind: 'string' },
      { key: 'description', kind: 'string' },
      { key: 'techStack', kind: 'string[]', optional: true },
      { key: 'demoUrl', kind: 'url', optional: true },
      { key: 'repoUrl', kind: 'url' },
      { key: 'status', kind: 'enum', options: ['active', 'concept', 'archived'] },
      { key: 'featured', kind: 'boolean', optional: true },
    ],
  },
};

/** 由目录名反查集合配置（admin/api 路由用）。 */
export function getCollection(dir: string): CollectionConfig {
  const cfg = COLLECTIONS[dir as CollectionName];
  if (!cfg) throw new Error(`未知内容集合：${dir}`);
  return cfg;
}

/** 受保护的 API 前缀列表，供 middleware 使用。 */
export const API_PREFIXES = Object.values(COLLECTIONS).map((c) => `/api/${c.dir}`);
