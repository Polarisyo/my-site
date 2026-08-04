import type { APIRoute } from 'astro';
import {
  checkLogin,
  issueSession,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../../../server/auth';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // 环境变量由 astro:env 在启动时校验（缺失则服务起不来），此处无需运行时检查。
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: '请求体不是合法 JSON' }, 400);
  }

  const password = body?.password;
  if (typeof password !== 'string' || !password) {
    return json({ error: '请输入密码' }, 400);
  }

  if (!checkLogin(password)) {
    return json({ error: '密码错误' }, 401);
  }

  cookies.set(SESSION_COOKIE_NAME, issueSession(), sessionCookieOptions());
  return json({ ok: true });
};
