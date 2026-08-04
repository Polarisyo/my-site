import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME, verifySession } from './server/auth';

// dev 模式下 middleware 对所有请求（含预渲染页面）执行。
// 读 cookie 会访问 request.headers，预渲染页面上不可用会告警，
// 因此只在受保护路径上读 cookie；其余路径直接放行。
const PROTECTED_PREFIXES = ['/admin', '/api/notes'];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  if (!PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return next();
  }

  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  const ok = verifySession(token);
  context.locals.session = ok;

  if (pathname.startsWith('/admin')) {
    if (!ok) return context.redirect('/secret-garden');
  } else if (pathname.startsWith('/api/notes')) {
    if (!ok) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return next();
});
