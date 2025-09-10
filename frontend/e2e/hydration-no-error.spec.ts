import { test, expect } from '@playwright/test';

test('no hydration error in console on /edit', async ({ page }) => {
  const errs: string[] = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (/hydration/i.test(t)) errs.push(t);
  });
  await page.goto('http://localhost:3000/edit');
  // ให้เวลาหน้าโหลดสั้น ๆ แล้วตรวจว่าไม่มี error เกิดขึ้น
  await page.waitForTimeout(800);
  await expect(errs, errs.join('\n')).toHaveLength(0);
});