/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: {
      id: number;
      name: string;
      email: string;
      emailVerified: boolean;
    } | null;
  }
}

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly DATABASE_AUTH_TOKEN?: string;
  readonly SESSION_SECRET: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET?: string;
  readonly PUBLIC_SITE_URL: string;
  readonly ADMIN_EMAILS?: string;
  readonly RESEND_API_KEY?: string;
  readonly EMAIL_FROM?: string;
  readonly BLOB_READ_WRITE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
