import type { Page } from 'playwright';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Launches a headless Chromium browser with stealth plugin + Hebrew locale.
 * Returns the page and a `close()` function to tear down the browser.
 * Prefer `withPage()` over calling this directly — it handles cleanup on error.
 */
export async function launchPage(): Promise<{ page: Page; close: () => Promise<void> }> {
  const { chromium } = await import('playwright-extra');

  const StealthPlugin = require('puppeteer-extra-plugin-stealth');

  chromium.use(StealthPlugin() as Parameters<typeof chromium.use>[0]);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    geolocation: { latitude: 32.0853, longitude: 34.7818 }, // Tel Aviv
    permissions: ['geolocation'],
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { 'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7' },
  });
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

/**
 * Extracts feed data embedded by Next.js SSR from the `__NEXT_DATA__` script tag.
 * Yad2 uses React Query; the dehydrated state lives at
 * `pageProps.dehydratedState.queries[].state.data`, keyed by `queryKey[0]`.
 *
 * @param page - An active Playwright page that has already navigated to the target URL.
 * @param queryKey - The first element of the React Query `queryKey` array (e.g. `"feed"`).
 * @throws {Error} If no query with the given key is found in the dehydrated state.
 */
export async function extractNextData(
  page: Page,
  queryKey: string,
): Promise<Record<string, unknown>> {
  const html = await page.evaluate(
    (): string | null => document.getElementById('__NEXT_DATA__')?.textContent ?? null,
  );
  const result = parseNextData(html, queryKey);
  if (result === null) throw new Error(`Query "${queryKey}" not found in __NEXT_DATA__`);
  return result;
}

/**
 * Navigates to `url` and waits for the page `load` event (up to 40 s).
 * Use this before calling `extractNextData` or `extractNextDataByMatcher`.
 */
export async function navigateTo(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'load', timeout: 40000 });
}

/**
 * Resource manager for browser pages. Launches a fresh Chromium instance,
 * calls `fn` with the page, then closes the browser — even if `fn` throws.
 *
 * @param fn - Async callback that receives the page and returns a result.
 * @returns The value resolved by `fn`.
 */
export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const { page, close } = await launchPage();
  try {
    return await fn(page);
  } finally {
    await close();
  }
}

type QueryKeyMatcher = (queryKey: unknown[]) => boolean;

function findQueryDataByMatcher(
  queries: Array<Record<string, unknown>>,
  matcher: QueryKeyMatcher,
): Record<string, unknown> | null {
  const match = queries.find((q) => {
    const qKey = q['queryKey'];
    return Array.isArray(qKey) && matcher(qKey as unknown[]);
  });
  const state = match?.['state'] as Record<string, unknown> | undefined;
  return (state?.['data'] as Record<string, unknown> | undefined) ?? null;
}

function parseNextDataByMatcher(
  html: string | null,
  matcher: QueryKeyMatcher,
): Record<string, unknown> | null {
  if (html === null) return null;
  const parsed = JSON.parse(html) as Record<string, unknown>;
  const props = parsed['props'] as Record<string, unknown> | undefined;
  const pageProps = props?.['pageProps'] as Record<string, unknown> | undefined;
  const dehydrated = pageProps?.['dehydratedState'] as Record<string, unknown> | undefined;
  const queries = (dehydrated?.['queries'] as Array<Record<string, unknown>> | undefined) ?? [];
  return findQueryDataByMatcher(queries, matcher);
}

/**
 * Like `extractNextData` but uses a predicate instead of an exact key match.
 * Use this when the React Query `queryKey` array contains dynamic segments
 * (e.g. vehicle search params embedded in the key).
 *
 * @param page - Active Playwright page that has navigated to the target URL.
 * @param matcher - Predicate called with the full `queryKey` array; return `true` to select.
 * @param description - Human-readable label for the query, used in error messages.
 * @throws {Error} If no matching query is found in the dehydrated state.
 */
export async function extractNextDataByMatcher(
  page: Page,
  matcher: QueryKeyMatcher,
  description: string,
): Promise<Record<string, unknown>> {
  const html = await page.evaluate(
    (): string | null => document.getElementById('__NEXT_DATA__')?.textContent ?? null,
  );
  const result = parseNextDataByMatcher(html, matcher);
  if (result === null) throw new Error(`Query "${description}" not found in __NEXT_DATA__`);
  return result;
}
