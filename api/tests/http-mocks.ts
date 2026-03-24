import type { VercelRequest, VercelResponse } from '@vercel/node';
import { vi } from 'vitest';

export interface MockResponseState {
  statusCode: number;
  jsonBody: unknown;
  headers: Record<string, string>;
}

export function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: undefined,
    ...overrides,
  } as unknown as VercelRequest;
}

export function createMockRes(): { res: VercelResponse; state: MockResponseState } {
  const state: MockResponseState = {
    statusCode: 200,
    jsonBody: undefined,
    headers: {},
  };

  const res: Partial<VercelResponse> = {};

  res.setHeader = vi.fn((name: string, value: string | number | readonly string[]) => {
    state.headers[name] = Array.isArray(value) ? value.join(',') : String(value);
    return res as VercelResponse;
  }) as VercelResponse['setHeader'];

  res.status = vi.fn((code: number) => {
    state.statusCode = code;
    return res as VercelResponse;
  }) as VercelResponse['status'];

  res.json = vi.fn((payload: unknown) => {
    state.jsonBody = payload;
    return res as VercelResponse;
  }) as VercelResponse['json'];

  return { res: res as VercelResponse, state };
}
