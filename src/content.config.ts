import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// 抽出 notes schema 供服务端写入前复用校验（防坏数据杀构建）
export const notesSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  order: z.number().optional(),
  draft: z.boolean().default(false),
});

export type NoteData = z.infer<typeof notesSchema>;

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: notesSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    techStack: z.array(z.string()).default([]),
    demoUrl: z.string().url().optional(),
    repoUrl: z.string().url(),
    status: z.enum(['active', 'archived', 'concept']).default('active'),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, notes, projects };