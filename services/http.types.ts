export interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface VercelResponse {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}
