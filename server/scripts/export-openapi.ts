/**
 * מייצא את תיעוד ה-API לקובץ docs/openapi.json
 * הרצה: npm run openapi:export
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openapiDocument } from '../src/docs/openapi';

const outDir = join(__dirname, '..', 'docs');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'openapi.json');
writeFileSync(outFile, `${JSON.stringify(openapiDocument, null, 2)}\n`, 'utf8');
console.log(`OpenAPI written to ${outFile}`);
