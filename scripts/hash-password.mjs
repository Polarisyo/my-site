// 生成管理员密码的 scrypt 哈希，输出 salt:hash（hex），填入 .env 的 ADMIN_PASSWORD_HASH。
// 用法：npm run hash-password
//      npm run hash-password -- "你的密码"   （非交互式，便于脚本）

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const N = 16384, r = 8, p = 1, keyLen = 64;

function hash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, keyLen, { N, r, p }).toString('hex');
  return `${salt}:${hash}`;
}

function verify(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, keyLen, { N, r, p });
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

const argPwd = process.argv[2];
let password;
if (argPwd) {
  password = argPwd;
} else {
  const rl = createInterface({ input, output });
  password = await rl.question('请输入管理员密码（≥16 字符，建议随机串）: ');
  const confirm = await rl.question('再次确认: ');
  rl.close();
  if (password !== confirm) {
    console.error('两次输入不一致，已取消。');
    process.exit(1);
  }
}

if (password.length < 12) {
  console.warn('⚠ 警告：密码长度 < 12，爆破风险较高，建议 ≥16 字符随机串。');
}

const encoded = hash(password);
console.log('\nADMIN_PASSWORD_HASH=' + encoded);
console.log('\n将上面一行完整复制到 .env 即可。');

// 自检
console.log('\n自检 verify:', verify(password, encoded) ? 'OK' : 'FAIL');
