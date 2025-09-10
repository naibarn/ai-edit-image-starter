import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Hydration guard in layout', () => {
  it('includes body suppressHydrationWarning and pre-hydration clean script', () => {
    const p = join(process.cwd(), 'frontend', 'src', 'app', 'layout.tsx');
    const src = readFileSync(p, 'utf8');
    expect(src).toMatch(/<body[^>]*suppressHydrationWarning/);
    expect(src).toMatch(/id="pre-hydration-clean"/);
  });
});