import { parseNote, type ParsedNote } from './markdown';
import {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_CONTENT_REPO,
  GITHUB_SITE_REPO,
  GITHUB_SITE_BRANCH,
} from 'astro:env/server';

const GH_API = 'https://api.github.com';
const API_VERSION = '2022-11-28';

function ghHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': API_VERSION,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'my-site-admin',
    'Content-Type': 'application/json',
  };
}

function contentRepo(): string {
  return `${GITHUB_OWNER}/${GITHUB_CONTENT_REPO}`;
}
function siteRepo(): string {
  return `${GITHUB_OWNER}/${GITHUB_SITE_REPO}`;
}
function siteBranch(): string {
  return GITHUB_SITE_BRANCH;
}

export class GitHubError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
    public path: string,
  ) {
    super(`GitHub API ${status} ${statusText} @ ${path}: ${body.slice(0, 300)}`);
    this.name = 'GitHubError';
  }
}

async function ghJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(GH_API + url, {
    ...init,
    headers: { ...ghHeaders(), ...((init?.headers as Record<string, string>) || {}) },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new GitHubError(res.status, res.statusText, text, url);
  }
  return text ? JSON.parse(text) : (undefined as unknown as T);
}

function b64(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64');
}
function unb64(input: string): string {
  // GitHub 返回的 content 可能含换行，需先清理
  return Buffer.from(input.replace(/\n/g, ''), 'base64').toString('utf8');
}

export interface NoteMeta {
  slug: string;
  sha: string;
  name: string;
}

/** 列出 notes 目录下所有 .md 文件元信息（不含内容）。 */
export async function listNotes(): Promise<NoteMeta[]> {
  const data = await ghJson<any[]>(`/repos/${contentRepo()}/contents/notes`);
  if (!Array.isArray(data)) return [];
  return data
    .filter((f) => f.type === 'file' && f.name.endsWith('.md'))
    .map((f) => ({ slug: f.name.replace(/\.md$/, ''), sha: f.sha, name: f.name }));
}

export interface NoteDetail extends ParsedNote {
  slug: string;
  sha: string;
  raw: string;
}

/** 取单篇笔记（含 sha 与解析后的 data/body）。404 时返回 null。
 *  frontmatter 不合规时不抛错——返回兜底 data，让删除/编辑仍能工作（可手动修复）。 */
export async function getNote(slug: string): Promise<NoteDetail | null> {
  let data: any;
  try {
    data = await ghJson<any>(`/repos/${contentRepo()}/contents/notes/${slug}.md`);
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
  const raw = unb64(data.content);
  let parsed: ParsedNote;
  try {
    parsed = parseNote(raw);
  } catch {
    parsed = { data: { title: slug, category: '未分类', tags: [] }, body: raw };
  }
  return { slug, sha: data.sha, raw, data: parsed.data, body: parsed.body };
}

export interface WriteResult {
  slug: string;
  contentSha: string; // dataInMySite 新 commit sha
  bumped: boolean; // my-site submodule 指针是否更新成功
  bumpError?: string; // bump 失败时的原因
}

/** 创建笔记文件。若已存在返回 409。写入后自动 bump submodule。 */
export async function createNote(slug: string, md: string, message?: string): Promise<WriteResult> {
  // 先探测是否已存在
  const existing = await getNote(slug);
  if (existing) {
    const err = new GitHubError(409, 'Conflict', `notes/${slug}.md 已存在`, '');
    throw err;
  }
  const res = await ghJson<any>(`/repos/${contentRepo()}/contents/notes/${slug}.md`, {
    method: 'PUT',
    body: JSON.stringify({
      message: message || `note: 新增 ${slug}`,
      content: b64(md),
      branch: 'main',
    }),
  });
  const contentSha = res.commit?.sha as string;
  return finalize(slug, contentSha);
}

/** 更新笔记文件（需提供当前 sha 防并发覆盖）。写入后自动 bump submodule。 */
export async function updateNote(slug: string, md: string, sha: string, message?: string): Promise<WriteResult> {
  const res = await ghJson<any>(`/repos/${contentRepo()}/contents/notes/${slug}.md`, {
    method: 'PUT',
    body: JSON.stringify({
      message: message || `note: 更新 ${slug}`,
      content: b64(md),
      sha,
      branch: 'main',
    }),
  });
  const contentSha = res.commit?.sha as string;
  return finalize(slug, contentSha);
}

/** 删除笔记文件。服务端自取 sha。删除后自动 bump submodule。 */
export async function deleteNote(slug: string, message?: string): Promise<WriteResult> {
  const existing = await getNote(slug);
  if (!existing) {
    throw new GitHubError(404, 'Not Found', `notes/${slug}.md 不存在`, '');
  }
  const res = await ghJson<any>(`/repos/${contentRepo()}/contents/notes/${slug}.md`, {
    method: 'DELETE',
    body: JSON.stringify({
      message: message || `note: 删除 ${slug}`,
      sha: existing.sha,
      branch: 'main',
    }),
  });
  const contentSha = res.commit?.sha as string;
  return finalize(slug, contentSha);
}

/** 写操作收尾：尝试 bump my-site 的 submodule 指针。 */
async function finalize(slug: string, contentSha: string): Promise<WriteResult> {
  if (!contentSha) {
    return { slug, contentSha: '', bumped: false, bumpError: '未拿到 dataInMySite 提交 SHA' };
  }
  try {
    await bumpSubmodule(contentSha);
    return { slug, contentSha, bumped: true };
  } catch (e: any) {
    return {
      slug,
      contentSha,
      bumped: false,
      bumpError: e?.message || String(e),
    };
  }
}

/**
 * 把 my-site 仓库 src/content 这个 gitlink（mode 160000）的 SHA 更新到新值，
 * 并在 siteBranch 上新建 commit。Vercel 监测到 push 后自动重建。
 */
export async function bumpSubmodule(newContentSha: string): Promise<void> {
  const branch = siteBranch();

  // 1. 取分支当前 commit sha
  const ref = await ghJson<{ object: { sha: string } }>(`/repos/${siteRepo()}/git/refs/heads/${branch}`);
  const masterSha = ref.object.sha;

  // 2. 取 commit 的 tree sha
  const commit = await ghJson<{ tree: { sha: string } }>(`/repos/${siteRepo()}/git/commits/${masterSha}`);
  const baseTree = commit.tree.sha;

  // 3. 创建新 tree，覆盖 src/content gitlink 条目
  const newTree = await ghJson<{ sha: string }>(`/repos/${siteRepo()}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTree,
      tree: [
        {
          path: 'src/content',
          mode: '160000',
          type: 'commit',
          sha: newContentSha,
        },
      ],
    }),
  });

  // 4. 创建 commit
  const newCommit = await ghJson<{ sha: string }>(`/repos/${siteRepo()}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      tree: newTree.sha,
      parents: [masterSha],
      message: 'chore: bump content submodule',
    }),
  });

  // 5. 更新分支引用
  await ghJson(`/repos/${siteRepo()}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });
}
