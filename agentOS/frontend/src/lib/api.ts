import ky, { HTTPError, type KyInstance } from "ky";
import { supabase } from "./supabase";
import type { ApiError } from "@/types";

const api: KyInstance = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 300000, // 5 minutes — import/generation can be slow for large repos
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          request.headers.set(
            "Authorization",
            `Bearer ${session.access_token}`,
          );
        }
      },
    ],
  },
});

async function handleError(error: unknown): Promise<never> {
  if (error instanceof HTTPError) {
    const body = (await error.response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const apiError: ApiError = {
      message: (body.message as string) ?? error.message,
      status: error.response.status,
      details: body,
    };
    throw apiError;
  }
  throw error;
}

export async function get<T>(path: string): Promise<T> {
  try {
    return await api.get(path).json<T>();
  } catch (error) {
    return handleError(error);
  }
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  try {
    return await api.post(path, { json: body }).json<T>();
  } catch (error) {
    return handleError(error);
  }
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  try {
    return await api.patch(path, { json: body }).json<T>();
  } catch (error) {
    return handleError(error);
  }
}

export async function del<T>(path: string): Promise<T> {
  try {
    return await api.delete(path).json<T>();
  } catch (error) {
    return handleError(error);
  }
}
