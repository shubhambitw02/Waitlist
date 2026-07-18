import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/download/',
  '/how-it-works/',
  '/faq/',
  '/safety/',
  '/community-guidelines/',
  '/contact/',
  '/privacy-policy/',
  '/terms/',
  '/account-deletion/',
] as const;

test('homepage exposes a concise Borivali-first Google result without image previews', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Barrtar: Local Tasks & Nearby Work in Borivali');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://barrtar.com/',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /max-image-preview:none/,
  );
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute(
    'content',
    /max-image-preview:none/,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /^Barrtar is a local task app in Borivali, Dahisar, and Mira Road\./,
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('all indexable pages have unique search metadata, canonicals, and no image previews', async ({
  page,
}) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.ok(), `${route} should load`).toBe(true);

    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(title, `${route} title`).toBeTruthy();
    expect(description, `${route} description`).toBeTruthy();
    expect(titles.has(title), `${route} title should be unique`).toBe(false);
    expect(descriptions.has(description ?? ''), `${route} description should be unique`).toBe(false);
    titles.add(title);
    descriptions.add(description ?? '');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://barrtar.com${route}`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /index,follow.*max-image-preview:none/,
    );
  }
});

test('sitemap and internal navigation expose every key page without broken local links', async ({
  page,
  request,
}) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapBody = await sitemap.text();

  for (const route of routes) {
    expect(sitemapBody).toContain(`<loc>https://barrtar.com${route}</loc>`);
  }

  const checked = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href')).filter((href): href is string => !!href),
    );

    for (const href of hrefs) {
      if (!href.startsWith('/') || checked.has(href)) continue;
      checked.add(href);
      const target = new URL(href, 'http://127.0.0.1').pathname;
      const response = await request.get(target);
      expect(response.ok(), `${href} linked from ${route}`).toBe(true);
    }
  }

  expect([...checked]).toEqual(
    expect.arrayContaining(['/download/', '/how-it-works/', '/faq/', '/safety/']),
  );
});

test('mobile navigation opens and reaches the primary sitelink candidates', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-project behavior');
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Open menu' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.mobile-menu').getByRole('link', { name: 'How it works' })).toBeVisible();

  await page.locator('.mobile-menu').getByRole('link', { name: 'How it works' }).click();
  await expect(page).toHaveURL(/\/how-it-works\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Need help nearby');
});
