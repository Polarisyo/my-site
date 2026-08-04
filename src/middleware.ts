import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME, verifySession } from './server/auth';
import { API_PREFIXES } from './server/collections';

// dev 模式下 middleware 对所有请求（含预渲染页面）执行。
// 读 cookie 会访问 request.headers，预渲染页面上不可用会告警，
// 因此只在受保护路径上读 cookie；其余路径直接放行。
// 受保护路径：/admin/* 与各内容集合的 /api/{collection}/*
const PROTECTED_API_PREFIXES = API_PREFIXES; // ['/api/notes', '/api/blog', '/api/projects']

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  const isAdmin = pathname.startsWith('/admin');
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAdmin && !isProtectedApi) {
    return next();
  }

  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  const ok = verifySession(token);
  context.locals.session = ok;

  if (isAdmin) {
    if (!ok) return context.redirect('/secret-garden');
  } else if (isProtectedApi) {
    if (!ok) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return next();
});
