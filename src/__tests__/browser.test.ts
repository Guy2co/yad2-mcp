import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddInitScript = vi.fn().mockResolvedValue(undefined);
const mockNewPage = vi.fn();
const mockNewContext = vi.fn();
const mockLaunch = vi.fn();
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockGoto = vi.fn().mockResolvedValue(undefined);
const mockEvaluate = vi.fn();

vi.mock('playwright', () => ({ chromium: { launch: mockLaunch } }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  const page = { goto: mockGoto, evaluate: mockEvaluate, addInitScript: mockAddInitScript };
  mockNewPage.mockResolvedValue(page);
  mockNewContext.mockResolvedValue({ newPage: mockNewPage });
  mockLaunch.mockResolvedValue({ newContext: mockNewContext, close: mockClose });
});

async function getContextOpt(key: string): Promise<unknown> {
  const { launchPage } = await import('../browser.js');
  await launchPage();
  return (mockNewContext.mock.calls[0][0] as Record<string, unknown>)[key];
}

async function getPage(): Promise<unknown> {
  const { launchPage } = await import('../browser.js');
  return (await launchPage()).page;
}

function makeNextData(queryKey: string, data: unknown): string {
  const queries = [{ queryKey: [queryKey], state: { data } }];
  return JSON.stringify({ props: { pageProps: { dehydratedState: { queries } } } });
}

async function runWebdriverScript(): Promise<Record<string, unknown>> {
  const { launchPage } = await import('../browser.js');
  await launchPage();
  const script = mockAddInitScript.mock.calls[0][0] as () => void;
  const nav: Record<string, unknown> = {};
  const spy = vi.spyOn(Object, 'defineProperty').mockImplementationOnce((obj, prop, desc) => {
    Object.defineProperty(nav, prop, desc);
    return obj;
  });
  script();
  spy.mockRestore();
  return nav;
}

describe('launchPage() — launch options', () => {
  it('launches headless chromium', async () => {
    const { launchPage } = await import('../browser.js');
    await launchPage();
    expect(mockLaunch).toHaveBeenCalledWith({ headless: true });
  });

  it('returns a close function that closes the browser', async () => {
    const { launchPage } = await import('../browser.js');
    const { close } = await launchPage();
    await close();
    expect(mockClose).toHaveBeenCalledOnce();
  });
});

describe('launchPage() — context locale/viewport', () => {
  it('sets locale to he-IL', async () => {
    expect(await getContextOpt('locale')).toBe('he-IL');
  });

  it('sets viewport to 1280x800', async () => {
    expect(await getContextOpt('viewport')).toEqual({ width: 1280, height: 800 });
  });
});

describe('launchPage() — context headers/UA', () => {
  it('sets Accept-Language header to he-IL', async () => {
    const headers = (await getContextOpt('extraHTTPHeaders')) as Record<string, string>;
    expect(headers['Accept-Language']).toContain('he-IL');
  });

  it('sets a Chrome user agent version >= 130', async () => {
    const ua = (await getContextOpt('userAgent')) as string;
    const match = ua.match(/Chrome\/(\d+)/);
    const version = parseInt((match ?? ['', '0'])[1], 10);
    expect(match).not.toBeNull();
    expect(version).toBeGreaterThanOrEqual(130);
  });
});

describe('launchPage() — webdriver patch', () => {
  it('calls addInitScript to patch navigator.webdriver', async () => {
    const { launchPage } = await import('../browser.js');
    await launchPage();
    expect(mockAddInitScript).toHaveBeenCalledOnce();
  });

  it('injected script sets webdriver to false', async () => {
    expect((await runWebdriverScript())['webdriver']).toBe(false);
  });
});

describe('navigateTo() — wait strategy', () => {
  it('uses waitUntil: load', async () => {
    const { navigateTo } = await import('../browser.js');
    await navigateTo((await getPage()) as never, 'https://example.com');
    expect(mockGoto).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ waitUntil: 'load' }),
    );
  });
});

describe('navigateTo() — timeout', () => {
  it('uses a timeout >= 15000ms', async () => {
    const { navigateTo } = await import('../browser.js');
    await navigateTo((await getPage()) as never, 'https://example.com');
    const { timeout } = mockGoto.mock.calls[0][1] as { timeout: number };
    expect(timeout).toBeGreaterThanOrEqual(15000);
  });
});

describe('extractNextData() — happy path', () => {
  it('returns data for a matching query key', async () => {
    const { extractNextData } = await import('../browser.js');
    mockEvaluate.mockResolvedValue(makeNextData('my-feed', { total: 42 }));
    expect(await extractNextData((await getPage()) as never, 'my-feed')).toEqual({ total: 42 });
  });
});

describe('extractNextData() — error cases', () => {
  it('throws when query key is not found', async () => {
    const { extractNextData } = await import('../browser.js');
    mockEvaluate.mockResolvedValue(makeNextData('other-feed', {}));
    await expect(extractNextData((await getPage()) as never, 'missing-key')).rejects.toThrow(
      'Query "missing-key" not found in __NEXT_DATA__',
    );
  });

  it('throws when __NEXT_DATA__ element is missing', async () => {
    const { extractNextData } = await import('../browser.js');
    mockEvaluate.mockResolvedValue(null);
    await expect(extractNextData((await getPage()) as never, 'any-key')).rejects.toThrow();
  });
});
