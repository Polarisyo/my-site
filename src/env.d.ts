/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** 已通过登录验证时为 true，由 middleware 写入。 */
    session: boolean;
  }
}
