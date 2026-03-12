import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { resolve } from 'path';

const SERVER_PATH = resolve(process.cwd(), 'dist/index.js');
type SpawnedProc = ReturnType<typeof spawn>;

function parseJsonLines(buffer: string): Record<string, unknown> | null {
  for (const line of buffer.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      // incomplete JSON
    }
  }
  return null;
}

function waitForResponse(proc: SpawnedProc): Promise<Record<string, unknown>> {
  return new Promise((res, rej) => {
    let buffer = '';
    const onData = (chunk: Buffer): void => {
      buffer += chunk.toString();
      const parsed = parseJsonLines(buffer);
      if (parsed !== null) {
        proc.stdout?.off('data', onData);
        res(parsed);
      }
    };
    proc.stdout?.on('data', onData);
    proc.on('error', rej);
  });
}

function sendMsg(proc: SpawnedProc, msg: Record<string, unknown>): void {
  proc.stdin?.write(JSON.stringify(msg) + '\n');
}

async function initServer(proc: SpawnedProc): Promise<void> {
  sendMsg(proc, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' },
    },
  });
  await waitForResponse(proc);
}

async function listTools(proc: SpawnedProc): Promise<Record<string, unknown>> {
  sendMsg(proc, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  return waitForResponse(proc);
}

async function callTool(
  proc: SpawnedProc,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  sendMsg(proc, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } });
  return waitForResponse(proc);
}

async function assertToolNames(proc: SpawnedProc): Promise<void> {
  const resp = await listTools(proc);
  const result = resp['result'] as Record<string, unknown>;
  const tools = result['tools'] as Array<{ name: string }>;
  const names = tools.map((t) => t.name);
  expect(names).toContain('search_rentals');
  expect(names).toContain('search_for_sale');
  expect(names).toContain('get_listing');
  expect(names).toContain('list_city_codes');
  expect(names).toContain('search_cars');
  expect(names).toContain('list_manufacturers');
  expect(names).toContain('which_tool');
}

async function assertCityCodes(proc: SpawnedProc): Promise<void> {
  const resp = await callTool(proc, 'list_city_codes', {});
  const result = resp['result'] as Record<string, unknown>;
  const content = result['content'] as Array<{ type: string; text: string }>;
  expect(content[0].text).toContain('Tel Aviv-Yafo');
  expect(content[0].text).toContain('5000');
}

async function assertManufacturers(proc: SpawnedProc): Promise<void> {
  const resp = await callTool(proc, 'list_manufacturers', {});
  const result = resp['result'] as Record<string, unknown>;
  const content = result['content'] as Array<{ type: string; text: string }>;
  expect(content[0].text).toContain('Toyota');
  expect(content[0].text).toMatch(/\d+/);
}

async function assertWhichTool(proc: SpawnedProc): Promise<void> {
  const resp = await callTool(proc, 'which_tool', {});
  const result = resp['result'] as Record<string, unknown>;
  const content = result['content'] as Array<{ type: string; text: string }>;
  expect(content[0].text).toContain('search_cars');
  expect(content[0].text).toContain('search_rentals');
}

describe('E2E: tools/list', { timeout: 15000 }, () => {
  it('lists all 7 tools', async () => {
    const proc = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    try {
      await initServer(proc);
      await assertToolNames(proc);
    } finally {
      proc.kill();
    }
  });
});

describe('E2E: list_city_codes', { timeout: 15000 }, () => {
  it('returns Tel Aviv-Yafo with code 5000', async () => {
    const proc = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    try {
      await initServer(proc);
      await assertCityCodes(proc);
    } finally {
      proc.kill();
    }
  });
});

describe('E2E: list_manufacturers', { timeout: 15000 }, () => {
  it('returns Toyota with an ID', async () => {
    const proc = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    try {
      await initServer(proc);
      await assertManufacturers(proc);
    } finally {
      proc.kill();
    }
  });
});

describe('E2E: which_tool', { timeout: 15000 }, () => {
  it('mentions search_cars and search_rentals', async () => {
    const proc = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    try {
      await initServer(proc);
      await assertWhichTool(proc);
    } finally {
      proc.kill();
    }
  });
});
