import { scryptSync, timingSafeEqual, createHmac, randomBytes } from 'node:crypto';
import { ADMIN_PASSWORD_HASH, SESSION_SECRET } from 'astro:env/server';

// scrypt 参数（与 scripts/hash-password.mjs 保持一致）
const SCRYPT_N = 16384, SCRYPT_r = 8, SCRYPT_p = 1, SCRYPT_keyLen = 64;

export const SESSION_COOKIE_NAME = 'admin_sess';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

/** 校验明文密码是否匹配存储的 salt:hash。常量时间比较。 */
export function verifyPassword(input: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  let derived: Buffer;
  try {
    derived = scryptSync(input, salt, SCRYPT_keyLen, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p });
  } catch {
    return false;
  }
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/** 登录端点用：判断密码是否正确。 */
export function checkLogin(password: string): boolean {
  return verifyPassword(password, ADMIN_PASSWORD_HASH);
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

/** 生成签名会话 token：base64url(payload).base64url(hmac)。 */
export function signSession(): string {
  const payload = JSON.stringify({ v: 1, exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = b64url(payload);
  const sig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest();
  return `${payloadB64}.${sig.toString('base64url')}`;
}

/** 校验会话 token，合法且未过期返回 true。HMAC 用常量时间比较。 */
export function verifySession(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  let expectedSig: Buffer;
  try {
    expectedSig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest();
  } catch {
    return false;
  }
  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return false;
  }
  // 长度不等直接 false，不拼接（避免 timing 泄露）
  if (expectedSig.length !== providedSig.length) return false;
  if (!timingSafeEqual(expectedSig, providedSig)) return false;

  let payload: { v?: number; exp?: number };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return false;
  }
  if (payload.v !== 1 || typeof payload.exp !== 'number') return false;
  if (Date.now() > payload.exp) return false;
  return true;
}

/** 生成新会话 token。SESSION_SECRET 由 astro:env 在启动时校验存在。 */
export function issueSession(): string {
  return signSession();
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
}

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // 本地 http://localhost 放开 Secure，否则浏览器不会存储；
    // 生产 Vercel 走 HTTPS，自动启用 Secure。
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/** 生成一个 32 字节 hex 随机串（供 SESSION_SECRET 初始化提示用）。 */
export function randomSecret(): string {
  return randomBytes(32).toString('hex');
}
