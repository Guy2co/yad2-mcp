import type { Page } from 'playwright';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function launchPage(): Promise<{ page: Page; close: () => Promise<void> }> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'he-IL' });
  const page = await context.newPage();
  return { page, close: (): Promise<void> => browser.close() };
}

function findQueryData(
  queries: Array<Record<string, unknown>>,
  key: string,
): Record<string, unknown> | null {
  const match = queries.find((q) => {
    const qKey = q['queryKey'];
    return Array.isArray(qKey) && qKey[0] === key;
  });
  const state = match?.['state'] as Record<string, unknown> | undefined;
  return (state?.['data'] as Record<string, unknown> | undefined) ?? null;
}

function parseNextData(html: string | null, queryKey: string): Record<string, unknown> | null {
  if (html === null) return null;
  const parsed = JSON.parse(html) as Record<string, unknown>;
  const props = parsed['props'] as Record<string, unknown> | undefined;
  const pageProps = props?.['pageProps'] as Record<string, unknown> | undefined;
  const dehydrated = pageProps?.['dehydratedState'] as Record<string, unknown> | undefined;
  const queries = (dehydrated?.['queries'] as Array<Record<string, unknown>> | undefined) ?? [];
  return findQueryData(queries, queryKey);
}

export async function extractNextData(
  page: Page,
  queryKey: string,
): Promise<Record<string, unknown>> {
  await page.waitForSelector('#__NEXT_DATA__', { timeout: 15000, state: 'attached' });
  const html = await page.evaluate(
    (): string | null => document.getElementById('__NEXT_DATA__')?.textContent ?? null,
  );
  const result = parseNextData(html, queryKey);
  if (result === null) throw new Error(`Query "${queryKey}" not found in __NEXT_DATA__`);
  return result;
}

export async function navigateTo(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
}
