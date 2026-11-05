// SAFE-05: every image the play page ships has a line in the art ledger (docs/design/art/README.md).
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');

it('every image in packages/ui/public/play is named in the art ledger', () => {
  const ledger = readFileSync(path.join(root, 'docs/design/art/README.md'), 'utf8');
  const images = readdirSync(path.join(root, 'packages/ui/public/play')).filter((f) =>
    /\.(webp|jpe?g|png|svg|gif|avif)$/i.test(f),
  );
  expect(images.length).toBeGreaterThan(0);
  const missing = images.filter((f) => !ledger.includes(`\`${f}\``));
  expect(missing).toEqual([]);
});
