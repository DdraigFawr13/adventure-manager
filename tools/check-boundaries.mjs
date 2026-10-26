// From Story-Generator scripts/check-boundaries.mjs@8a5c4ef, the owner's own code (D-116).
// Changed: layers are workspace packages (packages/<name>/src), imported by relative path or
// as @adventure-manager/<name>; ui may import React. Rules: docs/STANDARDS.md, PLAN §11h.
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const root = fileURLToPath(new URL('../', import.meta.url));
const allowed = {
  // Package layers (PLAN §11b). The engine is pure; content is data and schemas only.
  engine: new Set(['engine']),
  content: new Set(['content', 'engine']),
  ui: new Set(['ui', 'engine', 'content']),
  shell: new Set(['shell', 'engine', 'content']),
  tools: new Set(['tools', 'engine', 'content']),
};
const pureLayers = new Set(['engine', 'content']);
const reactLayers = new Set(['ui']);
const packages = path.join(root, 'packages');
const scope = '@adventure-manager/';
const forbiddenCoreNames = new Set([
  'Date',
  'performance',
  'window',
  'document',
  'navigator',
  'fetch',
  'crypto',
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'localStorage',
  'indexedDB',
  'globalThis',
  'process',
  'require',
  'eval',
  'Function',
  'Intl',
  'localeCompare',
]);
// Safe math for determinism (REBOOT_PLAN §7.2): transcendental Math functions can differ
// between JS engines, so the new engine and content use lookup tables instead.
const safeMathLayers = new Set(['engine', 'content']);
const unsafeMathNames = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'sinh',
  'cosh',
  'tanh',
  'asinh',
  'acosh',
  'atanh',
  'exp',
  'expm1',
  'pow',
  'log',
  'log1p',
  'log2',
  'log10',
  'cbrt',
  'hypot',
  'random',
]);

export function checkModule(fileName, sourceText) {
  const layer = path.relative(packages, fileName).split(path.sep)[0];
  if (!allowed[layer]) return [`Unknown source layer: ${fileName}`];
  // A system folder's half-page rules spec sits beside its code (STANDARDS.md "Naming and size").
  if (path.basename(fileName) === 'SPEC.md') return [];
  // Only TypeScript is checked by typecheck and by this script, so nothing else may hide in src.
  if (!/\.tsx?$/.test(fileName)) return [`Only .ts and .tsx files belong in src: ${fileName}`];
  const errors = [];
  const source = parse(sourceText, {
    sourceType: 'module',
    sourceFilename: fileName,
    plugins: fileName.endsWith('.tsx') ? ['typescript', 'jsx'] : ['typescript'],
  });

  function checkImport(specifier) {
    if (specifier.type !== 'StringLiteral') {
      errors.push('Computed module imports are not allowed in production source.');
      return;
    }
    const name = specifier.value;
    let destination;
    if (name.startsWith(scope)) destination = name.slice(scope.length).split('/')[0];
    else if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(fileName), name);
      destination = path.relative(packages, target).split(path.sep)[0];
    } else {
      // Pure layers import nothing external; ui only React. Shell and tools may import any installed
      // package; package.json holds only the approved list (D-117).
      const reactOnly = reactLayers.has(layer) && !['react', 'react-dom/client'].includes(name);
      if (pureLayers.has(layer) || reactOnly)
        errors.push(`${layer} cannot import external module ${name}.`);
      return;
    }
    if (!allowed[layer].has(destination))
      errors.push(`${layer} cannot import ${destination}: ${name}.`);
  }
  // Type-safety rules from docs/STANDARDS.md, for every package: no `any`, no `@ts-ignore`,
  // no `as` casts except `as const`. A validated boundary marks its one cast with `// cast-ok: <why>`.
  const castOk = new Set();
  for (const comment of source.comments ?? []) {
    if (/@ts-(ignore|nocheck|expect-error)/.test(comment.value))
      errors.push(`@ts-ignore and similar are not allowed (line ${comment.loc.start.line}).`);
    if (/cast-ok:/.test(comment.value)) castOk.add(comment.loc.end.line + 1);
  }
  const mathObjects = new Set();
  function visit(node) {
    if (node.type === 'TSAnyKeyword') errors.push(`No \`any\` (line ${node.loc.start.line}).`);
    if (
      node.type === 'TSAsExpression' &&
      !(
        node.typeAnnotation.type === 'TSTypeReference' &&
        node.typeAnnotation.typeName.name === 'const'
      ) &&
      !castOk.has(node.loc.start.line)
    )
      errors.push(`No \`as\` casts outside a marked boundary (line ${node.loc.start.line}).`);
    if (node.type === 'TSTypeAssertion') errors.push(`No <T> casts (line ${node.loc.start.line}).`);
    if (
      ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) &&
      node.source
    ) {
      checkImport(node.source);
    }
    if (node.type === 'TSImportType') checkImport(node.argument ?? node.source);
    if (node.type === 'ImportExpression') checkImport(node.source);
    if (node.type === 'CallExpression' && node.callee.type === 'Import') {
      if (node.arguments[0]) checkImport(node.arguments[0]);
      else errors.push('Missing module specifier.');
    }
    if (pureLayers.has(layer) && node.type === 'Identifier' && forbiddenCoreNames.has(node.name)) {
      errors.push(`Simulation core cannot use ${node.name}.`);
    }
    if (
      pureLayers.has(layer) &&
      node.type === 'MemberExpression' &&
      node.computed &&
      node.property.type === 'StringLiteral' &&
      forbiddenCoreNames.has(node.property.value)
    ) {
      errors.push(`Simulation core cannot use ${node.property.value}.`);
    }
    if (
      safeMathLayers.has(layer) &&
      node.type === 'MemberExpression' &&
      node.object.type === 'Identifier' &&
      node.object.name === 'Math'
    ) {
      mathObjects.add(node.object);
      const name = node.computed
        ? node.property.type === 'StringLiteral'
          ? node.property.value
          : null
        : node.property.name;
      if (name === null) errors.push('Computed Math access is not allowed in the engine.');
      else if (unsafeMathNames.has(name))
        errors.push(`Engine math must be deterministic: Math.${name} is not allowed.`);
    }
    if (
      safeMathLayers.has(layer) &&
      ((node.type === 'BinaryExpression' && node.operator === '**') ||
        (node.type === 'AssignmentExpression' && node.operator === '**='))
    ) {
      errors.push('Engine math must be deterministic: ** is not allowed.');
    }
    // Math may only be used as `Math.<name>`, so aliases and destructuring cannot hide unsafe calls.
    if (
      safeMathLayers.has(layer) &&
      node.type === 'Identifier' &&
      node.name === 'Math' &&
      !mathObjects.has(node)
    ) {
      errors.push('Engine code may use Math only as Math.<function>.');
    }
    for (const child of Object.values(node)) {
      if (Array.isArray(child))
        child.forEach((item) => {
          if (item?.type) visit(item);
        });
      else if (child && typeof child === 'object' && typeof child.type === 'string') visit(child);
    }
  }
  visit(source);
  return [...new Set(errors)];
}

async function sources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await sources(name)));
    else result.push(name);
  }
  return result;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const files = [];
  for (const entry of await readdir(packages, { withFileTypes: true })) {
    const src = path.join(packages, entry.name, 'src');
    if (entry.isDirectory() && existsSync(src)) files.push(...(await sources(src)));
  }
  const errors = files.length ? [] : ['No source modules found under packages/*/src.'];
  for (const file of files) {
    errors.push(
      ...checkModule(file, await readFile(file, 'utf8')).map(
        (error) => `${path.relative(root, file)}: ${error}`,
      ),
    );
  }
  if (errors.length) {
    process.stderr.write(errors.join('\n') + '\n');
    process.exitCode = 1;
  } else
    process.stdout.write(`Import/runtime boundaries passed for ${files.length} source modules.\n`);
}
