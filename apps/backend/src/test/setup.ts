/**
 * Global test setup — executed by Vitest before every test file.
 *
 * Environment variables are set here so that they are available when any
 * module is first imported (modules read env vars at load time, e.g.
 * TOKEN_HASH_SECRET in utils/token-hash.ts).
 *
 * Values used here are **test-only** and never touch real infrastructure.
 */

process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-chars-long';
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.TOKEN_HASH_SECRET = 'test-token-hash-secret';
process.env.DIRECT_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SENDGRID_API_KEY = 'SG.test-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
