import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';
import { api } from '../helpers';

type Operation = { security?: unknown[]; responses: Record<string, unknown>; summary?: string };
type Paths = Record<string, Record<string, Operation>>;

describe('Swagger / OpenAPI', () => {
  it('serves the OpenAPI document with a Bearer JWT security scheme', async () => {
    const res = await api().get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('serves Swagger UI at /api-docs', async () => {
    const res = await api().get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toMatch(/swagger/i);
  });

  it('documents 401 for every protected operation and every operation has a summary', () => {
    const paths = openapiDocument.paths as Paths;
    for (const [path, ops] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(ops)) {
        expect(op.summary, `${method} ${path}`).toBeTruthy();
        const isPublic = Array.isArray(op.security) && op.security.length === 0;
        if (!isPublic) expect(op.responses['401'], `${method} ${path}`).toBeDefined();
      }
    }
  });

  it('documents every route that exists in the router (and nothing extra)', () => {
    const routesSource = readFileSync(join(__dirname, '../../src/routes/index.ts'), 'utf8');
    const routes = [...routesSource.matchAll(/apiRouter\.(get|post|put|patch|delete)\('([^']+)'/g)].map(
      (m) => `${m[1]} /api${m[2].replace(/:(\w+)/g, '{$1}')}`,
    );
    const documented = Object.entries(openapiDocument.paths as Paths).flatMap(([path, ops]) =>
      Object.keys(ops).map((method) => `${method} ${path}`),
    );
    expect(routes.length).toBeGreaterThan(20);
    expect(new Set(documented)).toEqual(new Set(routes));
  });

  it('docs/openapi.json is in sync with the code', () => {
    const file = JSON.parse(readFileSync(join(__dirname, '../../docs/openapi.json'), 'utf8'));
    expect(file).toEqual(JSON.parse(JSON.stringify(openapiDocument)));
  });
});
