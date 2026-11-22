/**
 * One private request() function that:
 *  gets current session
 *  builds headers: Authorization if session; Content-Type JSON if body
 * fetches full URL with method, headers, and body turned into a json string
 * reads body as JSON, throws appropriate err if necessary, and returns data cast as T
 */

import { supabase } from "@/lib/supabase";
import { ApiError, ErrorEnvelopeSchema } from "@gratya/shared";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is undefined");

type HTTPMethod = "GET" | "PATCH" | "POST" | "DELETE";

async function request<T>(
  method: HTTPMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  // get current session fresh for each request
  const {
    data: { session },
  } = await supabase.auth.getSession();

  //build headers
  const headers: Record<string, string> = {};
  if (session) headers["Authorization"] = `Bearer ${session.access_token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // fetch full url
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  //read body as JSON; if can't read, fall back to null
  const data = await res.json().catch(() => null);

  // if it failed, try to check why and throw an appropriate client side error
  if (!res.ok) {
    if (res.status === 401)
      // sign out first on unauthorized err
      await supabase.auth.signOut();

    const result = ErrorEnvelopeSchema.safeParse(data);
    if (!result.success)
      // if response is not parsable, construct an internal error
      throw new ApiError("INTERNAL", "Error occured");
    else
      throw new ApiError(
        result.data.error.code,
        result.data.error.message,
        result.data.error.details,
      );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
};
