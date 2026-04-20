import type { ApiResponse, ApiError } from "@tripboard/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:3001";

class APIClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private headers(): HeadersInit {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers(),
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const err = (await res.json()) as ApiError;
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }
    const json = (await res.json()) as ApiResponse<T>;
    return json.data;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = (await res.json()) as ApiError;
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }
    const json = (await res.json()) as ApiResponse<T>;
    return json.data;
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = (await res.json()) as ApiError;
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }
    const json = (await res.json()) as ApiResponse<T>;
    return json.data;
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) {
      const err = (await res.json()) as ApiError;
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }
    const json = (await res.json()) as ApiResponse<T>;
    return json.data;
  }
}

export const apiClient = new APIClient(API_URL);
