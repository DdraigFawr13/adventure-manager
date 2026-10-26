import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs tool script without type declarations
import { checkModule } from '../check-boundaries.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const engineFile = path.join(root, 'packages/engine/src/core/sample.ts');
const uiFile = path.join(root, 'packages/ui/src/sample.ts');
const check = (file: string, code: string): string[] => checkModule(file, code);

describe('package boundary check (STANDARDS.md, PLAN §11h)', () => {
  it('passes clean engine code', () => {
    expect(check(engineFile, 'export const x = Math.floor(3 / 2) + Math.max(1, 2);')).toEqual([]);
  });

  it.each([
    ["import x from 'lodash';", 'external module'],
    ["import { a } from '../../../ui/src/a.ts';", 'cannot import ui'],
    ["import { a } from '@adventure-manager/ui';", 'cannot import ui'],
    ['export const t = Date.now();', 'Date'],
    ['export const r = Math.random();', 'Math.random'],
    ['export const s = Math.sin(1);', 'Math.sin'],
    ['export const p = 2 ** 3;', '**'],
    ['let p = 2; p **= 3;', '**'],
    ['const { pow } = Math;', 'Math only'],
    ['const M = Math;', 'Math only'],
    ["export const k = Math['sin'];", 'Math.sin'],
  ])('rejects %s in the engine', (code, message) => {
    expect(check(engineFile, code).join(' ')).toContain(message);
  });

  it('applies type-safety rules everywhere', () => {
    expect(check(uiFile, 'export let a: any;').join(' ')).toContain('any');
    expect(check(uiFile, '// @ts-ignore\nexport const a = 1;').join(' ')).toContain('@ts-ignore');
    expect(check(uiFile, 'export const a = 1 as unknown;').join(' ')).toContain('as');
    expect(check(uiFile, "export const a = ['x'] as const;")).toEqual([]);
    expect(
      check(uiFile, '// cast-ok: validated by schema\nexport const a = 1 as unknown;'),
    ).toEqual([]);
  });

  it('allows React in ui only', () => {
    expect(check(uiFile, "import { useState } from 'react';")).toEqual([]);
    expect(check(uiFile, "import x from 'lodash';").join(' ')).toContain('external module');
  });

  it('rejects files that typecheck would skip', () => {
    expect(check(engineFile.replace('.ts', '.mjs'), '').join(' ')).toContain('Only .ts');
  });

  it("allows a system folder's SPEC.md but no other Markdown in src", () => {
    expect(check(engineFile.replace('sample.ts', 'SPEC.md'), '# Spec')).toEqual([]);
    expect(check(engineFile.replace('sample.ts', 'notes.md'), '').join(' ')).toContain('Only .ts');
  });
});
